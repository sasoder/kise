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
  hash,
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  DASH_OFF,
  DASH_ON,
  FakePerson,
  INK,
  INK_HI,
  INK_LO,
  MARCH_W,
  MODEL_EDGE,
  MODEL_MARK,
  ModelDot,
  PERSON_H,
  PersonGlyph,
  STROKE_W,
  THREAD_GAP,
  TWO_PI,
  Wall,
  camKnots3,
  runCam3,
} from "./trapShared";
import { arriveEase } from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Trap`, cut 1 `DeployToTheRealWorld`.
//
// Context: "if you have a sufficiently realistic evaluation environment" — then
// the line itself, at SRT in-point 2.279 s:
//   "then you can get a sense of, like, okay: is the AI actually going to behave
//    well when we deploy it in the real world?"
//
// DURATION. frame = round((t - 2.279) * 24):
//   then f0 · you f5 · can f11 · get f13 · a f15 · sense f17 · of f22 ·
//   like f25 · okay f31 · is f37 · the f43 · AI f47 · actually f54 ·
//   going-to f64 · behave f67 · well f72 · when f76 · we f80 · deploy f80 ·
//   in-the f86 · real f89 · world f92 (ends f97)
// Speech runs f0..97 and the set's 16-frame tail holds the resolved state:
// DURATION = 97 + 16 = 113.
export const DURATION = 113;

// ---------------------------------------------------------------------------
// V3 — TWO CHANGES, on the director's two notes. Beats, DURATION and the story
// are untouched; what changed is the SCALE the cut resolves at and the first
// sixteen frames.
//
//  (1) THE RING WAS TOO SMALL AT REST — 330 screen px against 780-880 in the
//      other four cuts, with the mark at 55 px against 64-73. The cause was the
//      resolved frame trying to hold the WHOLE real course inside the caption
//      band. The real world is OPEN-ENDED, so that is released: at rest the
//      frame holds the test ring whole, the gate, and the LOWER part of the real
//      course with its crowd, and the dashed forecast and the top of the crowd
//      RUN OFF THE TOP of the frame. Re-solved, the cut now rests at K_REF
//      itself (k 1.300) — the camera every size in trapShared is specified at —
//      so every noun reads at its nominal screen size: stroke 6.0, a real person
//      118.0, the mark 72.0. The wall went r 165 -> 200, i.e. 520 screen px at
//      rest against V2's 330, and the real course came down 2.2x -> 2.0x so that
//      a whole S of it is still in frame at rest (its first two lobes land on
//      screen y 542 and 292, the third on 43) while its top is not.
//
//  (2) "DASHED = FAKE" WAS NEVER TAUGHT before this cut used it. It is now, in
//      the first sixteen frames, as the cut's first mechanism: at f0 the ring is
//      a SOLID INK_HI circle and the three props are SOLID INK_HI people — the
//      test looks real — and a WIPE starts at the ring's bottom point and runs
//      up BOTH sides, converting solid -> marching dashes behind its two heads.
//      Each prop flips to `FakePerson` as the heads pass ITS OWN HEIGHT, not on
//      a timer: the dimming and the dashed circle are caused by the wipe
//      reaching it. The last prop is a dashed circle by f17 and the heads meet
//      the gate on f19 — see DEVIATIONS for why not f13. Everything after that
//      is as approved.
// ---------------------------------------------------------------------------
// THIS CUT HAS ITS OWN TALL WORLD. It does not use trapShared's TABLEAU — no
// stations, no folder, no evaluator, no wire, no `Tableau`. It takes the
// module's SIZES, its two ink rungs, `Wall`, `ModelDot`, `PersonGlyph`,
// `FakePerson` and the camera helpers, and lays its own world out: the test ring
// low down at world y 1600, and 800 world px of REAL WORLD above it. The camera
// travels UP through that world and the payoff is off-frame at f0.
//
// SOUND-OFF READING TEST — one sentence:
//   "a ring and the people in it turn from solid to dashed while a mark weaves a
//    little course past them; a dashed line runs up out of the ring on exactly
//    the same course, only bigger, between real people; then the mark goes out
//    and rides it, and the line turns solid behind it."
//
// THE IDEA. What the model does inside the (dashed) test is a FORECAST of what
// it will do outside. The test's little course and the real world's big course
// are THE SAME CURVE, the second one 2.0x the first, joined at the gate — the
// forecast is literally the small course continued. The mark then runs it.
//
// VOCABULARY, the clip's, unchanged:
//   the model    = the OpenAI mark (`ModelDot`), lit (ACCENT) the whole cut: it
//                  is behaving, i.e. working, throughout. Accent appears NOWHERE
//                  else — no thread, no gaze and no packet is motivated by this
//                  line, so the cut has none of them.
//   the test     = the white ring (`Wall`) with a GAP at its top point: the
//                  gate. SOLID at f0; dashed from f16 to the last frame, and its
//                  dashes march the whole time they exist.
//   the props    = `FakePerson`, reveal 0 -> 1 as the wipe passes them: a solid
//                  INK_HI person becomes an INK_LO person in a dashed circle.
//                  At PERSON_H / SCALE_UP, because the test is a scale model of
//                  the real thing — see DEVIATIONS.
//   real people  = `PersonGlyph`, solid, INK_HI, PERSON_H. Twelve of them,
//                  hashed, denser toward the top, never a row; the top of the
//                  crowd is off-frame at rest.
//   the lane     = white, INK_HI, SOLID: the course the model actually runs,
//                  inside the test. It is REAL and it never converts.
//   the forecast = the same curve x2.0 above the gate, DASHED, INK_LO — it has
//                  not happened yet — converting to SOLID INK_HI behind the mark
//                  as the mark reaches each piece of it.
// Two ink opacities only: INK_HI 1.0 (lane, wall, people, the solid forecast)
// and INK_LO 0.5 (the dashed forecast, the converted props and their circles).
// No text, no numerals, no second dot, no question mark, no people reacting.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion; the words are landings. Nothing in the cut
// is outside this list, and every item names the word it serves.
//
//  1. f0-19   "then you can get"   THE TEACHING WIPE. The cut opens close on the
//             (f0/f5/f11/f13)      test — k 1.721, the ring 688 screen px across
//                                  in a 1080 frame, a prop 78 px tall and the
//                                  mark 95 — with the ring SOLID and the three
//                                  props SOLID PEOPLE, and nothing else in frame.
//                                  A wipe leaves the ring's bottom point on f1
//                                  and runs up both sides at exactly the set's 45
//                                  screen px/frame; behind its two heads the ring
//                                  is marching dashes. Each prop dims to INK_LO
//                                  and grows its dashed circle as the heads pass
//                                  its own height — half converted on f8, f11,
//                                  f13, done by f11, f13, f17. The heads meet the
//                                  gate on f19: the test is now visibly a
//                                  SIMULATION, which is what the rest of the cut
//                                  — and the other four — is built on.
//  2. f0-15   "then you can get"   THE MODEL IS BEHAVING. The mark is already at
//                                  45% of its lane when the cut opens, weaving
//                                  the last of the slalom and decelerating into
//                                  the gate on arriveEase: it has been doing
//                                  this before the cut started.
//  3. f15-64  "a sense of, like"   THE FORECAST. On the frame the mark reaches
//             (f15/f17/f22/f25)    the gate, a DASHED INK_LO line starts growing
//                                  out of it — the mark's own curve, continued:
//                                  both are vertical at the gate, so the join is
//                                  C1 and there is no kink. Its head runs the big
//                                  slalom at up to 33.2 screen px/frame and the
//                                  CAMERA FOLLOWS IT (k 1.721 -> 1.299, content
//                                  centre 1646 -> 1183) while real people come
//                                  into frame from above and the line threads
//                                  between them, never touching one (42 world px
//                                  at its closest). The head lands at the top of
//                                  the course on f64, on screen y 139 with the
//                                  topmost person at 94, three frames before
//                                  "behave" (f67) and eight before "well" (f72).
//                                  That run is "okay is the AI actually going to
//                                  behave well" (f31/f37/f47/f54/f67).
//  4. f15-80  "it is not deployed  THE LAP. The mark holds at the gate for two
//             yet"                 frames (it looks out, f15-16), then runs 55%
//                                  of the lane back DOWN — re-weaving the two
//                                  props the camera still holds — turns on f40
//                                  and comes up again, arriving at the gate at
//                                  f80 with its speed still on it, so the
//                                  deployment is the same motion continuing. It
//                                  is inside the test the whole time the forecast
//                                  is drawn, and never sits below screen y 1374
//                                  while it is down there.
//  5. f64-90  "when we deploy"     THE SETTLE. One glide back DOWN to the
//             (f76/f80)            resolved framing (content centre 1183 ->
//                                  1411.5 at k 1.300) — 34 screen px short of
//                                  home on f88, 9 on f97, i.e. landed one frame
//                                  before "real" (f89) and creeping in after it.
//                                  The camera follows the SUBJECT, which by then
//                                  is the mark coming out of the gate and not the
//                                  forecast's head. The resolved frame holds the
//                                  ring whole with its bottom on screen y 1332
//                                  and the gate on 812, and the lower two thirds
//                                  of the real course with eight of its twelve
//                                  people; the other four and the top of the
//                                  forecast run off the top.
//  6. f80-113 "in the real world"  THE DEPLOYMENT. On "deploy" (f80) the mark
//             (f86/f89/f92)        goes OUT through the gap in the wall and rides
//                                  the forecast, and behind it the line converts
//                                  dashed INK_LO -> solid INK_HI, because the
//                                  mark has reached it — 15.5 world px of
//                                  daylight either side of it in the gate. It is
//                                  30% of the way up on the last frame, on screen
//                                  y 476, still moving at 13.1 screen px/frame,
//                                  still weaving, still touching no one.
//
// LIVENESS — mechanisms, not gestures; none is on a word and none ever stops:
// the wall's marching dashes (and the props' circles', and the forecast's),
// `breath` on the model, the mark moving on every single frame of the cut, the
// grid's parallax and its own -0.3 px/frame drift, and a camera whose decaying
// drift is still running at DURATION.
//
// ---------------------------------------------------------------------------
// THE CURVE. One shape, used twice. Over t in [0, 1] from a course's start to
// its end, with m = (t - 0.14) / 0.72 clamped to [0, 1]:
//     x(t) = -A * sin(3 pi m) * env(m)          y(t) = -H * t
//     env(m) = smoothstep(m / 0.13) * smoothstep((1 - m) / 0.13)
// Three lobes — left, right, left — past three props that alternate the other
// way, which is what a slalom is. Two things make the join work:
//   * the slalom lives in the MIDDLE 72% of the course, so each end of it is a
//     straight run: the small course runs straight into the gate and the big one
//     straight out of it.
//   * `env` takes the amplitude to zero at both ends of the slalom with zero
//     slope, so the curve is VERTICAL where the straight runs meet it.
// The small course therefore ends vertical and the big one starts vertical: C1
// at the gate, with no mirroring and no kink, and the big course is the small
// one scaled 2.0x about the gate point — the same shape in the same handedness,
// not a reflection. Everything that travels on either is parametrised BY ARC
// LENGTH.
//
// THE WORLD, in world px (the resolved camera is k 1.300, so a world px is 1.3
// screen px there):
//   wall        centre (540, 1600), r 200, with a GAP at its top point: the
//               `draw` 0.927 wipe leaves a 45.5 world px chord half-width, and
//               the mark's half-box is 27.69, so it passes the gate with 15.5
//               world px of daylight either side.
//   small lane  from (540, 1800) — the wall's bottom point — to the gate at
//               (540, 1400). H_S = 400 = the ring's diameter, A_S = 42.4 (the
//               ring's own 0.212 r, as before).
//   props       on the lobes, at x 540 +- 75.2, y 1696 / 1600 / 1504.
//   big lane    the same curve x2.0 out of the gate: H_B = 800, A_B = 84.8, its
//               top at (540, 600).
//   the crowd   twelve people, PERSON_H 90.77, on a jittered lattice between
//               world y 600 and 1110, six a side, eight of them in the resting
//               frame and four off the top of it — see THE CROWD.
//
// ---------------------------------------------------------------------------
// CAMERA — knots on ONE monotone cubic Hermite (`camKnots3`, Fritsch-Carlson,
// one key per frame, cy taken off the eased k) through the shared damper
// (`runCam3`). cx is 540 on every knot: the composition is a centred column, so
// the camera only tilts and zooms. 26 frames of PRE-ROLL run through the damper
// before frame 0, so f0 is already moving instead of standing still.
//
//   knot f -26   k 1.78   c 1658     PRE-ROLL
//   knot f   0   k 1.70   c 1640     close on the ring, already easing out
//   knot f  16   k 1.54   c 1480     THE LIFT, with the wipe: the camera climbs
//                                    with the two heads, which is also what keeps
//                                    them under 45 screen px/frame up the sides
//   knot f  38   k 1.38   c 1300     THE FOLLOW, carrying velocity through
//   knot f  56   k 1.30   c 1120     ...so the damped apex lands under the
//                                    forecast's head on f64
//   knot f  88   k solved c 1411.5   THE SETTLE back down to the resolved framing
//   knot f 112   k -0.010 c   +8     still drifting on the last frame
//   knot f 180   k -0.032 c  +26     the drift's continuation, off the end
// K_END is SOLVED (secant) so the damped camera reads exactly K_REST = 1.300 on
// the last frame — K_REF itself, which is what puts every noun at its nominal
// screen size in the resolved frame. Damped, measured (k / content centre):
// f0 1.721 / 1646 · f16 1.583 / 1531 · f30 1.462 / 1404 · f50 1.336 / 1209 ·
// f64 1.300 / 1183 · f80 1.303 / 1305 · f97 1.307 / 1410 · f112 1.300 / 1417.
// The camera's own screen speed peaks at 23.2 px/frame with |dv| 2.06 px/frame^2
// (the set's ceiling is 2.2) and never falls below 0.17, so no frame is parked.
//
// ---------------------------------------------------------------------------
// See `STATS` at the foot of this file: every number claimed above is measured
// there over every frame, at each frame's own camera.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//   * THE WIPE'S HEADS REACH THE GATE ON f19, NOT f12-14. They are capped at 45
//     screen px/frame like every other head in the set, and the two constraints
//     do not both fit. Each head travels a half-circumference of the ring,
//     r * pi * WALL_DRAW = 582.5 world px. At the bottom point a head moves
//     HORIZONTALLY, where the camera's own upward glide cancels none of it, so
//     its ceiling there is 45 / k; the cancellation only arrives as the head
//     turns vertical up the sides. Integrating that ceiling against this camera
//     (k 1.721 at f0, the content centre lifting ~7 world px/frame) the fastest
//     legal wipe covers the half-circumference in 19 frames, and every one of
//     those frames measures at the ceiling. What the brief actually wants taught
//     does land in its window — "by 'get a sense' (f13-17) the whole test is
//     dashed": the three PROPS, which are what "fake" is really taught on, are
//     converted on f11, f13 and f17, and all that is left after f17 is the last
//     26 degrees of the ring either side of the gate. The alternatives were all
//     worse: a 45-px/f wipe landing on f13 needs k <= 1.05 at f0 (the cut would
//     open WIDER than it rests, and the crowd, which must be off-frame at f0,
//     would be visible), and letting the heads run at 60-70 px/f breaks the
//     set's ceiling on the one gesture whose whole job is to be read.
//
//   * THE REAL COURSE IS 2.0x THE TEST'S, NOT 2.2x (the brief allows 1.8-2.2).
//     At 2.2 the third lobe of the big slalom sits 31 world px above the resting
//     frame's top edge and the resolved frame holds one and a half lobes; at 2.0
//     the first two land on screen y 542 and 292 with the third on 43, so a whole
//     S is in frame and 175 world px of course still runs off the top. The two curves stay the same shape in the same handedness, which
//     is the point of the pair.
//
//   * A PROP IS PERSON_H / SCALE_UP, NOT PERSON_H. The test's course is the real
//     one at 1/2.0, so its props are too: the test is a scale model, which is
//     what makes the two slaloms read as the same course. At the opening camera
//     a prop is 79 screen px tall. Full-size props cannot be done at all: three
//     of them is 272 world px of glyph stacked inside a ring 400 world px
//     across, before the lane that has to weave around them.
//
//   * THE SLALOM SITS IN THE MIDDLE 72% OF THE COURSE, and the props ALTERNATE
//     SIDES at x 540 +- P_S while the lane swings +- A_S the other way. Both are
//     unchanged from V1 and for the same reasons: run edge to edge the third
//     lobe lands too close to the gate for the lane to come back to the axis
//     without clipping that prop, and a prop standing ON the axis is overlapped
//     by the lane at the crossings whatever the amplitude is.
//
//   * THE MARK SHUTTLES THE LANE RATHER THAN CIRCLING IT. The brief asks the
//     mark to "circle back onto its course"; a return arc would have to run
//     between the prop circles and the wall, which is 40 world px of room. So it
//     reaches the gate on f15, holds two frames, runs 55% of the way back down,
//     turns on f40 and comes up again, arriving at the gate on f80 with its speed
//     still on it. It turns on f40 and not half way through the cut because the
//     camera is climbing through those frames: the lower the mark goes while the
//     camera is high, the deeper into the caption band it sits, and turning on
//     f40 keeps it above screen y 1374 on every frame of the lap.
//
//   * THE HEADS AND THE MARK ARE ALL CAPPED AGAINST THE CAMERA. Speeds are
//     integrated per frame at min(V, 42 / k(f)) (the wipe against its own exact
//     screen velocity, which is not parallel to the camera's), so nothing is
//     ever over the set's 45 screen px/frame however tight the camera is, and V
//     is SOLVED (bisection) so the forecast's head still lands exactly on f64
//     and the mark still leaves exactly on f80.
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
    then: z.number(),
    get: z.number(),
    sense: z.number(),
    okay: z.number(),
    ai: z.number(),
    behave: z.number(),
    well: z.number(),
    when: z.number(),
    deploy: z.number(),
    real: z.number(),
    world: z.number(),
    end: z.number(), // speech ends; tail to 113
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
    then: 0,
    get: 13,
    sense: 17,
    okay: 31,
    ai: 47,
    behave: 67,
    well: 72,
    when: 76,
    deploy: 80,
    real: 89,
    world: 92,
    end: 97,
  },
});

export const WORLD_W = 1080;
export const WORLD_H = 1920;
export const AX = 540;
const LAST = DURATION - 1;
/** The frame the speech ends on. The next cut butts against THIS state, not
 *  against the last frame: the editor lays it over this cut's 16-frame tail. */
export const SPEECH_END = 97;

// --- the world --------------------------------------------------------------
/** V3: the cut rests at K_REF itself, the camera trapShared solves every screen
 *  size at, so a stroke is 6.0 screen px here, a person 118.0 and the mark 72.0
 *  — the same as in the other four cuts. */
export const K_REST_TARGET = 1.3;
export const R_WALL = 200;
export const WALL_C = { x: AX, y: 1600 };
export const GATE = { x: AX, y: WALL_C.y - R_WALL }; // 1400
export const LANE_START_Y = WALL_C.y + R_WALL; // 1800
export const SCALE_UP = 2.0;
export const H_S = 2 * R_WALL; // 400
const A_S = 0.212 * R_WALL; // 42.4 — the ring's own fraction, as in V1
const P_S = 0.376 * R_WALL; // 75.2 — the props' offset, the other way
const END_TAPER = 0.13;
/** The slalom sits in the MIDDLE of the course; the course runs straight into
 *  the gate at one end and out of the start at the other. See DEVIATIONS. */
const SLALOM_0 = 0.14;
const SLALOM_1 = 0.86;
/** The gap left at the top of the wall for the gate, as a fraction of it. The
 *  gate's chord half-width is R_WALL * sin((1 - WALL_DRAW) * pi) = 45.0 world
 *  px, against the mark's half-box (MODEL_EDGE 27.69) and half the wall's
 *  stroke: 15.0 world px of daylight either side of the mark. */
export const WALL_DRAW = 0.927;

export const FAKE_H = PERSON_H / SCALE_UP; // 45.4
const FAKE_RING_R = FAKE_H * 0.66; // FakePerson's own geometry
/** person.png's ink is 0.84 of its box, so this is a glyph's ink half-width. */
const PERSON_INK_HW = PERSON_H * 0.42;

// ---------------------------------------------------------------------------
// THE RESOLVED FRAMING, solved here because the crowd is solved against it.
//
// The resolved content centre is SOLVED against the ring rather than against the
// ink's extent: the real world runs off the top of the frame now, so there is no
// finite ink column to centre. The ring's bottom lands on screen y 1340 — inside
// the caption band's 1400, with the sway's worst 6.5 screen px still 53 px clear
// of it — which at k 1.300 puts the gate on screen 819 and the content centre
// (screen 835) on world 1411.5, i.e. 11 world px above the gate: half the frame
// is the test, half is the real world, and the seam between them sits where the
// composition is centred.
// ---------------------------------------------------------------------------
export const RING_BOTTOM_SCREEN = 1340;
export const C_REST =
  LANE_START_Y - (RING_BOTTOM_SCREEN - 960 + CAM_LIFT) / K_REST_TARGET;
/** The world y of the resting frame's TOP edge. Anything above this is off the
 *  top at rest: the upper crowd and the last of the course. */
export const TOP_WORLD_REST = C_REST + CAM_LIFT / K_REST_TARGET - 960 / K_REST_TARGET;

const envOf = (m: number) =>
  smoothstep(clamp01(m / END_TAPER)) * smoothstep(clamp01((1 - m) / END_TAPER));
/** The slalom's own parameter: 0 where it starts, 1 where it ends, clamped to
 *  the straight runs outside it. */
const slalomM = (t: number) => clamp01((t - SLALOM_0) / (SLALOM_1 - SLALOM_0));
/** The shape, as an offset from the course's START point. */
const shapeX = (t: number) => {
  if (t < SLALOM_0 || t > SLALOM_1) return 0;
  const m = slalomM(t);
  return -A_S * Math.sin(3 * Math.PI * m) * envOf(m);
};
const shapeY = (t: number) => -H_S * t;

export const smallPt = (t: number) => ({ x: AX + shapeX(t), y: LANE_START_Y + shapeY(t) });
export const bigPt = (t: number) => ({
  x: AX + SCALE_UP * shapeX(t),
  y: GATE.y + SCALE_UP * shapeY(t),
});
/** A prop stands on the far side of the axis from the lane's lobe. */
const propOffset = (t: number) => {
  if (t < SLALOM_0 || t > SLALOM_1) return 0;
  const m = slalomM(t);
  return P_S * Math.sin(3 * Math.PI * m) * envOf(m);
};
const smallProp = (t: number) => ({ x: AX + propOffset(t), y: LANE_START_Y + shapeY(t) });
const bigProp = (t: number) => ({
  x: AX + SCALE_UP * propOffset(t),
  y: GATE.y + SCALE_UP * shapeY(t),
});

/** The three lobe centres, in course parameter. */
const LOBES = [1 / 6, 1 / 2, 5 / 6].map((m) => SLALOM_0 + (SLALOM_1 - SLALOM_0) * m);
export const FAKE_PROPS = LOBES.map(smallProp);

// --- arc-length tables for both courses -------------------------------------
const CURVE_N = 900;

const tabulate = (pt: (t: number) => { x: number; y: number }) => {
  const tab = new Float64Array(CURVE_N + 1);
  let prev = pt(0);
  for (let i = 1; i <= CURVE_N; i++) {
    const p = pt(i / CURVE_N);
    tab[i] = tab[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return tab;
};
export const TAB_S = tabulate(smallPt);
export const TAB_B = tabulate(bigPt);
export const L_S = TAB_S[CURVE_N];
export const L_B = TAB_B[CURVE_N];

/** The curve parameter at arc length `s`, by binary search on the table. */
export const tAtS = (tab: Float64Array, s: number) => {
  const x = Math.max(0, Math.min(tab[CURVE_N], s));
  let lo = 0;
  let hi = CURVE_N;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (tab[m] <= x) lo = m;
    else hi = m;
  }
  const u = (x - tab[lo]) / Math.max(1e-9, tab[hi] - tab[lo]);
  return (lo + u) / CURVE_N;
};

// ---------------------------------------------------------------------------
// THE CROWD. A jittered lattice over the upper part of the big course, with the
// acceptance rising toward the top (denser up there, feathered out at the
// bottom), plus the two people that stand opposite the big lane's second and
// third lobes — the rhyme with the props inside the test.
//
// Its BOTTOM is solved, not chosen: the payoff has to be entirely off-frame at
// f0 (the set's rule — open on the subject, destination out of frame). At f0 the
// camera holds world y 1600 at screen 835 with k 1.83, so the frame's top edge
// is at world 1600 - (960 - CAM_LIFT) / 1.83 = 1143, and the lowest person's INK
// (their centre + 0.42 PERSON_H = 38.1) has to clear it: CROWD_BOT 1080 puts
// that ink bottom at 1118.1, 25 world px inside the edge.
//
// Its FILLING ORDER is solved too. The resting frame's top edge is at world
// TOP_WORLD_REST, so only seats below TOP_WORLD_REST + PERSON_H / 2 are wholly
// in it, and the brief asks for six of them. So the lower band is seated FIRST,
// up to CROWD_LOW, and the upper band takes the rest — while the lattice's
// acceptance still rises toward the top, so the crowd thickens as it leaves the
// frame rather than thinning out.
//
// Every seat is rejected if its ink comes within PERSON_INK_HW + MODEL_EDGE + 18
// of the big lane, if it is within MIN_GAP of an accepted seat, or if it is
// outside CROWD_HX of the centre column (which is what keeps the side margin at
// rest over the brief's 70 px).
// ---------------------------------------------------------------------------
const CROWD_TOP = 600;
const CROWD_BOT = 1110;
const CROWD_HX = 300; // |x - AX| ceiling for a centre
const LANE_CLEAR = PERSON_INK_HW + MODEL_EDGE + 18;
const MIN_GAP = 100;
const CROWD_N = 12;
/** how many of them are seated in the band the resting frame holds whole */
const CROWD_LOW = 7;
const CROWD_VIS_Y = TOP_WORLD_REST + PERSON_H / 2;

/** The big lane's x at world y (or null above/below it). */
const laneXAt = (y: number) => {
  const t = (GATE.y - y) / (SCALE_UP * H_S);
  if (t < 0 || t > 1) return null;
  return bigPt(t).x;
};

/** The closest the big lane comes to (x, y), measured over the person's own
 *  height so a seat cannot sit in a swing the lane makes just above it. */
const laneDist = (x: number, y: number) => {
  let d = Infinity;
  for (let i = -6; i <= 6; i++) {
    const yy = y + (i / 6) * (PERSON_H / 2);
    const lx = laneXAt(yy);
    if (lx === null) continue;
    d = Math.min(d, Math.abs(x - lx));
  }
  return d;
};

type Seat = { x: number; y: number };

export const CROWD: Seat[] = (() => {
  const out: Seat[] = [];
  /** A crowd that ends up 8-4 across the column reads as a drift to one side
   *  rather than as people either side of a road, so a seat is also rejected
   *  when its own side is already two ahead of the other. */
  const sideCount = (right: boolean) => out.filter((o) => o.x > AX === right).length;
  const push = (s: Seat) => {
    for (const o of out) {
      if (Math.hypot(o.x - s.x, o.y - s.y) < MIN_GAP) return false;
    }
    if (laneDist(s.x, s.y) < LANE_CLEAR) return false;
    if (Math.abs(s.x - AX) > CROWD_HX) return false;
    if (s.y < CROWD_TOP || s.y > CROWD_BOT) return false;
    if (sideCount(s.x > AX) > sideCount(s.x <= AX) + 1) return false;
    out.push(s);
    return true;
  };
  // the two that stand opposite the lane's lobes: the rhyme with the props
  push(bigProp(LOBES[1]));
  push(bigProp(LOBES[2]));
  // the lattice
  const COLS = 6;
  const ROWS = 10;
  const stepX = (2 * CROWD_HX) / COLS;
  const stepY = (CROWD_BOT - CROWD_TOP) / (ROWS - 1);
  const seats: { s: Seat; q: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = r * COLS + c;
      // columns are staggered half a step in y and every seat is jittered by
      // 1.3 of its own step, so no two accepted seats end up on a rule
      const x = AX - CROWD_HX + (c + 0.5) * stepX + (hash(id, 11) - 0.5) * stepX * 0.9;
      const y =
        CROWD_TOP +
        r * stepY +
        (c % 2) * stepY * 0.5 +
        (hash(id, 12) - 0.5) * stepY * 1.3;
      // denser toward the top: a seat low down needs a better hash to exist
      const up = 1 - (y - CROWD_TOP) / (CROWD_BOT - CROWD_TOP);
      if (hash(id, 13) > 0.68 + 0.32 * Math.pow(clamp01(up), 1.2)) continue;
      seats.push({ s: { x, y }, q: y });
    }
  }
  // the band the resting frame holds whole, bottom-up...
  const low = seats.filter((s) => s.s.y >= CROWD_VIS_Y).sort((a, b) => b.q - a.q);
  for (const s of low) {
    if (out.filter((o) => o.y >= CROWD_VIS_Y).length >= CROWD_LOW) break;
    push(s.s);
  }
  // ...then everything else, top-down, so the density falls downward
  const rest = seats.sort((a, b) => a.q - b.q);
  for (const s of rest) {
    if (out.length >= CROWD_N) break;
    push(s.s);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE CAMERA. One tilt up through the world and one settle back down onto the
// resolved framing, with the zoom easing out under the first half of it. The
// apex is SHALLOW on purpose: a deeper follow makes the return steeper than the
// climb, and an asymmetric reversal is what puts a bump in the damper's jerk.
// ---------------------------------------------------------------------------
export const PRE = 26;
const KNOTS = (kEnd: number) => [
  { f: 0, k: 1.78, x: AX, y: 1658 },
  { f: PRE, k: 1.7, x: AX, y: 1640 },
  { f: PRE + 16, k: 1.54, x: AX, y: 1480 },
  { f: PRE + 38, k: 1.38, x: AX, y: 1300 },
  { f: PRE + 56, k: 1.3, x: AX, y: 1120 },
  { f: PRE + 88, k: kEnd, x: AX, y: C_REST },
  { f: PRE + 112, k: kEnd - 0.01, x: AX, y: C_REST + 8 },
  { f: PRE + 180, k: kEnd - 0.032, x: AX, y: C_REST + 26 },
];

/** The camera's TARGET track (before the damper), one key per frame, out to
 *  `last`. Exported so the next cut can continue this one's camera exactly:
 *  it runs the same damper over these targets and adds its own on the end. */
export const camTargets = (last: number) => camKnots3(KNOTS(K_END), last);

const trackFor = (kEnd: number) => camKnots3(KNOTS(kEnd), PRE + DURATION + 70);
const kAtLast = (kEnd: number) => {
  const t = trackFor(kEnd);
  return runCam3(LAST + PRE, t.CX, t.CY, t.K).k;
};
export const K_END = (() => {
  const a = 1.2;
  const b = 1.4;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom the whole cut is written against. */
export const K_REST = kAtLast(K_END);
/** The camera's knots, with K_END already solved in. The next cut keeps every
 *  one of these up to the resting-drift knot and hangs its own moves off the
 *  end, so its camera IS this one's, continued: same spline, same damper, run
 *  from the same f = 0. */
export const CAM_KNOTS = KNOTS(K_END);
const CAM = trackFor(K_END);
/** The grid's parallax reference — the camera's own cy at f0. The next cut
 *  passes this same value so the background cannot jump at the join. */
export const GRID_CY_REF = CAM.CY[PRE];

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCam3(f + PRE, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: c.cx + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 2, Math.round(f)));
export const camAt = (f: number) => CAM_AT_F[clampF(f)];
const kAt = (f: number) => camAt(f).k;
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return [WORLD_W / 2 + (wx - c.cx) * c.k, 960 + (wy - c.cy) * c.k] as const;
};

// ---------------------------------------------------------------------------
// THE MOTION. Every speed is integrated per frame at min(V, HEAD_CAP / k(f)),
// so nothing is ever over the set's ceiling at any zoom, and V is solved so the
// landings keep their frames.
// ---------------------------------------------------------------------------
const HEAD_CAP = 42; // screen px/frame; the set's ceiling is 45

const F_GATE = 15; // the mark reaches the gate — "a sense" (f15/f17)
const F_TURN = 17; // ...holds, then runs back
const F_BOTTOM = 40; // the far turn
const T_TURN = 0.45; // how far back down the course the mark runs before it turns
const F_DEPLOY = 80; // "deploy"
const F_HEAD_END = 64; // the forecast head lands — two frames before "well"
const END_FRACTION = 0.3; // where the mark is on the big course at DURATION - 1

/** A normalised speed profile: eased ramp in over `r0`, eased ramp out over
 *  `r1`, flat between. */
const profile = (t: number, r0: number, r1: number) =>
  (r0 > 0 ? smoothstep(clamp01(t / r0)) : 1) *
  (r1 > 0 ? smoothstep(clamp01((1 - t) / r1)) : 1);

/** Forward-integrate `v(f)` from `f0` to `f1`, capped against the camera. */
const integrate = (f0: number, f1: number, v: (f: number) => number) => {
  const out: number[] = [];
  let s = 0;
  out.push(0);
  for (let f = f0 + 1; f <= f1; f++) {
    s += Math.min(v(f), HEAD_CAP / kAt(f));
    out.push(s);
  }
  return out;
};

/** Solve the nominal speed `V` so the capped integral covers `dist` exactly. */
const solveV = (f0: number, f1: number, dist: number, shape: (t: number) => number) => {
  const reach = (V: number) =>
    integrate(f0, f1, (f) => V * shape((f - f0) / (f1 - f0)))[f1 - f0];
  let lo = 1;
  let hi = 400;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (reach(mid) < dist) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

// ---------------------------------------------------------------------------
// THE TEACHING WIPE (V3). Two heads leave the ring's bottom point and run up
// opposite sides; behind each of them the wall is marching dashes, and a prop
// converts as they pass its height.
//
// THE CAP IS EXACT, not nominal. A head on a ring does not move parallel to the
// camera: at the bottom point it travels HORIZONTALLY, so the camera's upward
// glide cancels none of it, and only as the head turns up the side does the
// cancellation arrive. So the per-frame step is solved (bisection) against the
// head's own SCREEN displacement under the real camera — position, zoom and all
// — and never exceeds WIPE_CAP.
// ---------------------------------------------------------------------------
const WIPE_CAP = 45; // screen px/frame, the set's ceiling
const HALF_ARC = R_WALL * Math.PI * WALL_DRAW; // 582.5
const F_WIPE = 16; // the heads meet the gate — see DEVIATIONS
/** The wipe head's world position at arc `s` from the bottom point, on `side`. */
const wipeHeadAt = (s: number, side: number) => {
  const phi = s / R_WALL;
  const a = Math.PI / 2 + side * phi;
  return { x: WALL_C.x + Math.cos(a) * R_WALL, y: WALL_C.y + Math.sin(a) * R_WALL };
};

const WIPE_S: number[] = (() => {
  // the profile is in TIME, not in arc: a head that eased in on its own
  // position would never leave the bottom point at all.
  const shape = (f: number) => profile(Math.min(1, f / F_WIPE), 0.14, 0);
  const run = (V: number) => {
    const out: number[] = new Array(DURATION + 3).fill(HALF_ARC);
    let s = 0;
    out[0] = 0;
    for (let f = 1; f <= DURATION + 2; f++) {
      if (s >= HALF_ARC) {
        out[f] = HALF_ARC;
        continue;
      }
      const want = Math.min(HALF_ARC - s, V * shape(f));
      // the biggest step whose SCREEN displacement is inside the cap
      const disp = (ds: number) => {
        let m = 0;
        for (const side of [-1, 1]) {
          const a = wipeHeadAt(s, side);
          const b = wipeHeadAt(s + ds, side);
          const pa = screenAt(f - 1, a.x, a.y);
          const pb = screenAt(f, b.x, b.y);
          m = Math.max(m, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]));
        }
        return m;
      };
      let step = want;
      if (disp(want) > WIPE_CAP) {
        let lo = 0;
        let hi = want;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2;
          if (disp(mid) > WIPE_CAP) hi = mid;
          else lo = mid;
        }
        step = lo;
      }
      s = Math.min(HALF_ARC, s + step);
      out[f] = s;
    }
    return out;
  };
  // solve the nominal speed so the heads meet the gate exactly on F_WIPE
  let lo = 1;
  let hi = 400;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (run(mid)[F_WIPE] < HALF_ARC - 1e-6) lo = mid;
    else hi = mid;
  }
  return run(hi);
})();

const wipeAt = (f: number) => WIPE_S[clampF(f)];
/** The wipe heads' own height in the world: where the conversion has got to. */
const wipeHeadY = (f: number) => WALL_C.y + R_WALL * Math.cos(wipeAt(f) / R_WALL);
/** How far a prop has converted, caused by the heads passing ITS height. The
 *  ramp is 180 world px of head travel — about five frames at the speed the
 *  heads are doing up the sides — so the circle draws rather than pops. */
const PROP_RAMP = 180;
const propReveal = (f: number, y: number) =>
  smoothstep(clamp01((y + PROP_RAMP / 2 - wipeHeadY(f)) / PROP_RAMP));

// --- the forecast head: out of the gate on f15, landing on f70 --------------
const HEAD_SHAPE = (t: number) => profile(t, 0.14, 0.22);
const V_HEAD = solveV(F_GATE, F_HEAD_END, L_B, HEAD_SHAPE);
export const HEAD_S: number[] = (() => {
  const run = integrate(F_GATE, F_HEAD_END, (f) =>
    V_HEAD * HEAD_SHAPE((f - F_GATE) / (F_HEAD_END - F_GATE)),
  );
  const out: number[] = new Array(DURATION + 3).fill(0);
  for (let f = 0; f <= DURATION + 2; f++) {
    out[f] = f < F_GATE ? 0 : f >= F_HEAD_END ? L_B : Math.min(L_B, run[f - F_GATE]);
  }
  return out;
})();

// --- the mark ---------------------------------------------------------------
// Leg 1  f0..f15    it is already running: arriveEase into the gate, so the
//                   deceleration into the hold is the end of a motion that
//                   started before the cut did.
// Leg 2  f15..f17   the hold at the gate.
// Leg 3  f17..f49   back down the lane, eased at both ends.
// Leg 4  f49..f80   up again, eased out of the bottom turn and NOT decelerating
//                   at the gate: it carries its speed into the deployment.
// Leg 5  f80..      the big course.
const DOWN_SHAPE = (t: number) => profile(t, 0.1, 0.22);
const UP_SHAPE = (t: number) => profile(t, 0.32, 0);
const LEG_DIST = L_S * (1 - T_TURN);
const V_DOWN = solveV(F_TURN, F_BOTTOM, LEG_DIST, DOWN_SHAPE);
const V_UP = solveV(F_BOTTOM, F_DEPLOY, LEG_DIST, UP_SHAPE);

/** How far back the mark starts: the distance arriveEase can cover in F_GATE
 *  frames without the cruise ever breaking the cap at the opening zoom. */
const LEG1_DIST = (() => {
  // arriveEase cruises at 1.3x the mean, and the opening frames are the
  // tightest the camera ever is.
  let tightest = Infinity;
  for (let f = 0; f <= F_GATE; f++) tightest = Math.min(tightest, HEAD_CAP / kAt(f));
  return Math.min(L_S * 0.62, (tightest / 1.3) * F_GATE);
})();
const S_START = Math.max(0, L_S - LEG1_DIST);

const S_TURN = L_S - LEG_DIST;
const DOWN_RUN = integrate(F_TURN, F_BOTTOM, (f) =>
  V_DOWN * DOWN_SHAPE((f - F_TURN) / (F_BOTTOM - F_TURN)),
);
const UP_RUN = integrate(F_BOTTOM, F_DEPLOY, (f) =>
  V_UP * UP_SHAPE((f - F_BOTTOM) / (F_DEPLOY - F_BOTTOM)),
);
/** The speed the mark arrives at the gate with, so leg 5 continues it. */
const V_GATE = UP_RUN[F_DEPLOY - F_BOTTOM] - UP_RUN[F_DEPLOY - F_BOTTOM - 1];

const BIG_RAMP = 12;
export const V_BIG = (() => {
  const reach = (V2: number) => {
    let s = 0;
    for (let f = F_DEPLOY + 1; f <= LAST; f++) {
      const v = V_GATE + (V2 - V_GATE) * smoothstep(clamp01((f - F_DEPLOY) / BIG_RAMP));
      s += Math.min(v, HEAD_CAP / kAt(f));
    }
    return s;
  };
  let lo = 0;
  let hi = 60;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (reach(mid) < END_FRACTION * L_B) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

/** The mark's arc on the SMALL course (0..L_S) per frame; -1 once deployed. */
const DOT_S: number[] = (() => {
  const out: number[] = new Array(DURATION + 3).fill(-1);
  for (let f = 0; f <= DURATION + 2; f++) {
    if (f <= F_GATE) {
      out[f] = S_START + (L_S - S_START) * arriveEase(clamp01(f / F_GATE));
    } else if (f <= F_TURN) {
      out[f] = L_S;
    } else if (f <= F_BOTTOM) {
      out[f] = Math.max(S_TURN, L_S - DOWN_RUN[f - F_TURN]);
    } else if (f <= F_DEPLOY) {
      out[f] = Math.min(L_S, S_TURN + UP_RUN[f - F_BOTTOM]);
    }
  }
  return out;
})();

/** The mark's arc on the BIG course from F_DEPLOY; -1 before it. */
export const DOT_B: number[] = (() => {
  const out: number[] = new Array(DURATION + 3).fill(-1);
  let s = 0;
  out[F_DEPLOY] = 0;
  for (let f = F_DEPLOY + 1; f <= DURATION + 2; f++) {
    const v = V_GATE + (V_BIG - V_GATE) * smoothstep(clamp01((f - F_DEPLOY) / BIG_RAMP));
    s += Math.min(v, HEAD_CAP / kAt(f));
    out[f] = Math.min(L_B, s);
  }
  return out;
})();

/** Where the model is on frame `f`. */
export const modelAt = (f: number) => {
  const i = clampF(f);
  if (DOT_B[i] >= 0) return bigPt(tAtS(TAB_B, DOT_B[i]));
  return smallPt(tAtS(TAB_S, Math.max(0, DOT_S[i])));
};

// --- paths ------------------------------------------------------------------
export const pathOf = (
  pt: (t: number) => { x: number; y: number },
  t0: number,
  t1: number,
) => {
  const steps = Math.max(2, Math.ceil(Math.abs(t1 - t0) * 220));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = pt(t0 + (t1 - t0) * (i / steps));
    d += `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
};
export const LANE_D = pathOf(smallPt, 0, 1);

/** The disc the mark takes out of its own course, and the mask that does it.
 *  THREAD_GAP — the module's own "outside the mark" radius, 30.46 world px —
 *  so the lane stops exactly where an accent thread starts in the other cuts,
 *  and the mark's 5% breath still never reaches it. */
export const MODEL_HOLE = THREAD_GAP;
const MODEL_MASK_ID = "dtrw-model-hole";

// ---------------------------------------------------------------------------

const DeployToTheRealWorld: React.FC<Props> = ({
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

  // -- the teaching wipe: how much of the ring is dashed yet -----------------
  const halfSweep = wipeAt(frame) / R_WALL;

  // -- the forecast, and how much of it is already fact ----------------------
  const headS = HEAD_S[clampF(frame)];
  const solidS = Math.max(0, DOT_B[clampF(frame)]);
  const tHead = headS > 0 ? tAtS(TAB_B, headS) : 0;
  const tSolid = solidS > 0 ? tAtS(TAB_B, solidS) : 0;
  const model = modelAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[PRE]}
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
          {/* (1) the courses and the wall */}
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* THE MARK OCCLUDES ITS OWN COURSE. The model RIDES the lane here,
                so the lane necessarily passes under it — and the OpenAI mark has
                counters through its middle, so "under it" means the white line
                is seen THROUGH the blossom and cuts a bar across the subject of
                the opening frame. The lane is therefore drawn through a mask
                that takes a disc out at the model, at exactly THREAD_GAP, the
                radius every accent line in the other four cuts starts at: the
                lane ends where a thread would begin, the line visibly goes
                behind the mark, and nothing fakes an occlusion with a colour. */}
            <mask
              id={MODEL_MASK_ID}
              maskUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={WORLD_W}
              height={WORLD_H}
            >
              <rect x={0} y={0} width={WORLD_W} height={WORLD_H} fill="#fff" />
              <circle cx={model.x} cy={model.y} r={MODEL_HOLE} fill="#000" />
            </mask>

            <g mask={`url(#${MODEL_MASK_ID})`}>
              {/* THE FORECAST, still imagined: dashed, INK_LO, marching. Drawn
                  from where the mark has got to up to the head, so the moment
                  the mark reaches a piece of it, it stops being a forecast. */}
              {tHead > tSolid ? (
                <g style={{ filter: icon }}>
                  <path
                    d={pathOf(bigPt, tSolid, tHead)}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE_W}
                    strokeLinecap="butt"
                    strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                    strokeDashoffset={-frame * MARCH_W}
                    opacity={INK_LO}
                  />
                </g>
              ) : null}

              {/* ...and the part of it the mark has already made true: SOLID,
                  INK_HI, behind it. */}
              {tSolid > 0 ? (
                <g style={{ filter: icon }}>
                  <path
                    d={pathOf(bigPt, 0, tSolid)}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE_W}
                    strokeLinecap="round"
                    opacity={INK_HI}
                  />
                </g>
              ) : null}

              {/* THE LANE inside the test: solid, INK_HI, the course the model
                  actually runs. It is real, and it never converts. */}
              <g style={{ filter: icon }}>
                <path
                  d={LANE_D}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE_W}
                  strokeLinecap="round"
                  opacity={INK_HI}
                />
              </g>
            </g>

            {/* THE TEST ENVIRONMENT. SOLID at f0; the teaching wipe opens a
                DASHED range centred on the ring's bottom point and grows it to
                the gate by f16, which is `Wall`'s own dashedFrom/dashedSweep —
                the same mechanism cut 5 walks around behind its hand. The gate
                itself is the gap the `draw` wipe leaves at the top point. */}
            <Wall
              k={k}
              cx={WALL_C.x}
              cy={WALL_C.y}
              r={R_WALL}
              draw={WALL_DRAW}
              dashedFrom={Math.PI / 2 - halfSweep}
              dashedSweep={halfSweep > 0 ? Math.min(TWO_PI, 2 * halfSweep) : 0}
              march={frame}
              opacity={INK_HI}
            />
          </svg>

          {/* (2) the people. The props are the real ones at 1/SCALE_UP — the
              test is a scale model — and each of them turns from a solid person
              into a dim one in a dashed circle as the wipe's heads pass its own
              height. */}
          {FAKE_PROPS.map((p, i) => (
            <FakePerson
              key={`fp${i}`}
              k={k}
              frame={frame}
              x={p.x}
              y={p.y}
              h={FAKE_H}
              reveal={propReveal(frame, p.y)}
            />
          ))}
          {CROWD.map((p, i) => (
            <PersonGlyph key={`pg${i}`} k={k} x={p.x} y={p.y} opacity={INK_HI} />
          ))}

          {/* (3) THE MODEL, on top of everything, lit, breathing, moving on
              every frame of the cut. */}
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <ModelDot frame={frame} k={k} x={model.x} y={model.y} tone={1} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default DeployToTheRealWorld;

// Referenced so the accent prop is a real contract and not decoration: the
// model is the only accent in the cut and it is lit from f0.
export const ACCENT_USED_BY = "the model mark only";
export const BEAT_CHECK = {
  sense: defaultProps.beats.sense,
  well: defaultProps.beats.well,
  deploy: defaultProps.beats.deploy,
  real: defaultProps.beats.real,
};

// ---------------------------------------------------------------------------
// WHAT THE NEXT CUT BUTTS AGAINST. `PerfectMatch` opens on this cut's state at
// SPEECH_END (f97) — not at its last frame — because the editor lays it over
// this cut's 16-frame tail. Everything it needs is exported above; this is the
// state itself, measured off the same functions this file draws from.
// ---------------------------------------------------------------------------
export const STATE_AT_SPEECH_END = {
  frame: SPEECH_END,
  cam: camAt(SPEECH_END),
  model: modelAt(SPEECH_END),
  /** arc along the big course that is already SOLID (behind the mark) */
  solidArc: Math.max(0, DOT_B[SPEECH_END]),
  /** ...and how far the dashed forecast reaches (the whole course by f70) */
  headArc: HEAD_S[SPEECH_END],
  /** the mark's world speed on that frame, so the next cut can continue it */
  markSpeed: Math.max(0, DOT_B[SPEECH_END]) - Math.max(0, DOT_B[SPEECH_END - 1]),
  /** the wipe is long finished: the whole ring is dashed */
  wipeDone: WIPE_S[SPEECH_END] >= HALF_ARC - 1e-6,
};

// ---------------------------------------------------------------------------
// MEASUREMENTS, so every claim in the header is checked rather than asserted.
// ---------------------------------------------------------------------------
const speedOf = (at: (f: number) => { x: number; y: number }, f: number) => {
  const a = screenAt(f - 1, ...([at(f - 1).x, at(f - 1).y] as [number, number]));
  const b = screenAt(f, ...([at(f).x, at(f).y] as [number, number]));
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
};

export const STATS = (() => {
  const headPt = (f: number) => bigPt(tAtS(TAB_B, HEAD_S[clampF(f)]));
  let maxHead = 0;
  let maxHeadF = 0;
  let maxDot = 0;
  let maxDotF = 0;
  for (let f = 1; f <= LAST; f++) {
    if (HEAD_S[f] > 0 && HEAD_S[f] < L_B) {
      const v = speedOf(headPt, f);
      if (v > maxHead) {
        maxHead = v;
        maxHeadF = f;
      }
    }
    const v = speedOf(modelAt, f);
    if (v > maxDot) {
      maxDot = v;
      maxDotF = f;
    }
  }
  // the wipe's two heads, at their own exact screen speed
  let maxWipe = 0;
  let maxWipeF = 0;
  for (let f = 1; f <= F_WIPE + 2; f++) {
    for (const side of [-1, 1]) {
      const a = wipeHeadAt(WIPE_S[f - 1], side);
      const b = wipeHeadAt(WIPE_S[f], side);
      const pa = screenAt(f - 1, a.x, a.y);
      const pb = screenAt(f, b.x, b.y);
      const v = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      if (v > maxWipe) {
        maxWipe = v;
        maxWipeF = f;
      }
    }
  }
  const wipeLand = (() => {
    for (let f = 0; f <= DURATION; f++) if (WIPE_S[f] >= HALF_ARC - 1e-6) return f;
    return -1;
  })();
  // when each prop is half converted, and when it is done
  const propFlip = FAKE_PROPS.map((p) => {
    let half = -1;
    let done = -1;
    for (let f = 0; f <= DURATION; f++) {
      const r = propReveal(f, p.y);
      if (half < 0 && r >= 0.5) half = f;
      if (done < 0 && r >= 0.999) done = f;
    }
    return [half, done];
  });
  // the camera: screen speed of a fixed world point, and its own jerk
  const probe = { x: AX, y: WALL_C.y };
  const camSpeed: number[] = [];
  for (let f = 1; f <= LAST; f++) {
    const a = screenAt(f - 1, probe.x, probe.y);
    const b = screenAt(f, probe.x, probe.y);
    camSpeed.push(Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  // the clearance the mark keeps from every prop and every person
  let minFake = Infinity;
  let minReal = Infinity;
  for (let f = 0; f <= LAST; f++) {
    const m = modelAt(f);
    for (const p of FAKE_PROPS) {
      minFake = Math.min(
        minFake,
        Math.hypot(m.x - p.x, m.y - p.y) - MODEL_EDGE - (FAKE_RING_R + STROKE_W / 2),
      );
    }
    for (const p of CROWD) {
      const dx = Math.max(0, Math.abs(m.x - p.x) - PERSON_INK_HW);
      const dy = Math.max(0, Math.abs(m.y - p.y) - PERSON_H * 0.42);
      minReal = Math.min(minReal, Math.hypot(dx, dy) - MODEL_EDGE);
    }
  }
  // the resolved frame
  const lastF = LAST;
  const ringBot = screenAt(lastF, AX, LANE_START_Y)[1];
  const ringTop = screenAt(lastF, AX, GATE.y)[1];
  const topWorldRest = camAt(lastF).cy - 960 / camAt(lastF).k;
  const visibleCrowd = CROWD.filter((p) => p.y - PERSON_H / 2 >= topWorldRest).length;
  let minMargin = Infinity;
  for (const p of CROWD) {
    if (p.y - PERSON_H / 2 < topWorldRest) continue;
    minMargin = Math.min(
      minMargin,
      screenAt(lastF, p.x - PERSON_INK_HW, p.y)[0],
      WORLD_W - screenAt(lastF, p.x + PERSON_INK_HW, p.y)[0],
    );
  }
  minMargin = Math.min(
    minMargin,
    screenAt(lastF, WALL_C.x - R_WALL - STROKE_W / 2, WALL_C.y)[0],
  );
  // is any real person visible at f0?
  const topWorldF0 = camAt(0).cy - 960 / camAt(0).k;
  const lowestPerson = Math.max(...CROWD.map((p) => p.y + PERSON_INK_HW));
  // how much of the big course is in frame at rest, and which lobes
  const lobeScreenRest = LOBES.map((t) => Number(screenAt(lastF, bigPt(t).x, bigPt(t).y)[1].toFixed(0)));
  return {
    kRest: Number(K_REST.toFixed(5)),
    kEnd: Number(K_END.toFixed(5)),
    kOpen: Number(CAM_AT_F[0].k.toFixed(4)),
    strokeScreenRest: Number((STROKE_W * K_REST).toFixed(2)),
    strokeScreenOpen: Number((STROKE_W * CAM_AT_F[0].k).toFixed(2)),
    personScreenRest: Number((PERSON_H * K_REST).toFixed(1)),
    propScreenOpen: Number((FAKE_H * CAM_AT_F[0].k).toFixed(1)),
    propScreenRest: Number((FAKE_H * K_REST).toFixed(1)),
    markScreenRest: Number((MODEL_MARK * K_REST).toFixed(1)),
    markScreenOpen: Number((MODEL_MARK * CAM_AT_F[0].k).toFixed(1)),
    wallScreenOpen: Number((2 * R_WALL * CAM_AT_F[0].k).toFixed(0)),
    wallScreenRest: Number((2 * R_WALL * K_REST).toFixed(0)),
    ringBottomScreenRest: Number(ringBot.toFixed(1)),
    ringTopScreenRest: Number(ringTop.toFixed(1)),
    lobeScreenRest,
    crowdVisibleAtRest: visibleCrowd,
    /** the gate's chord half-width against the mark's half-box */
    gateHalfChord: Number((R_WALL * Math.sin((1 - WALL_DRAW) * Math.PI)).toFixed(1)),
    gateClearPerSide: Number(
      (R_WALL * Math.sin((1 - WALL_DRAW) * Math.PI) - MODEL_EDGE - STROKE_W / 2).toFixed(1),
    ),
    laneLenSmall: Number(L_S.toFixed(1)),
    laneLenBig: Number(L_B.toFixed(1)),
    crowd: CROWD.length,
    crowdSeats: CROWD.map((p) => [Math.round(p.x), Math.round(p.y)]),
    wipeHalfArc: Number(HALF_ARC.toFixed(1)),
    wipeLandF: wipeLand,
    maxWipePx: Number(maxWipe.toFixed(2)),
    maxWipeF,
    propFlip,
    sStart: Number(S_START.toFixed(1)),
    tStart: Number(tAtS(TAB_S, S_START).toFixed(3)),
    vHead: Number(V_HEAD.toFixed(2)),
    vBig: Number(V_BIG.toFixed(2)),
    maxHeadPx: Number(maxHead.toFixed(2)),
    maxHeadF,
    maxDotPx: Number(maxDot.toFixed(2)),
    maxDotF,
    minCamPx: Number(Math.min(...camSpeed).toFixed(3)),
    maxCamPx: Number(Math.max(...camSpeed).toFixed(3)),
    minFakeClear: Number(minFake.toFixed(1)),
    minRealClear: Number(minReal.toFixed(1)),
    sideMarginRest: Number(minMargin.toFixed(1)),
    topWorldF0: Number(topWorldF0.toFixed(1)),
    topWorldRest: Number(topWorldRest.toFixed(1)),
    lowestPersonInk: Number(lowestPerson.toFixed(1)),
    crowdHiddenAtF0: lowestPerson < topWorldF0,
    headLandsAt: F_HEAD_END,
    headScreenAtLand: [58, 62, 64, 70, 80].map((f) => [
      f,
      Number(screenAt(f, bigPt(tAtS(TAB_B, HEAD_S[f])).x, bigPt(tAtS(TAB_B, HEAD_S[f])).y)[1].toFixed(0)),
    ]),
    crowdTopScreenAtLand: Number(
      screenAt(64, AX, Math.min(...CROWD.map((p) => p.y - PERSON_H / 2)))[1].toFixed(0),
    ),
    ringBottomScreenAtLand: Number(screenAt(64, AX, LANE_START_Y)[1].toFixed(0)),
    dotFracAtLast: Number((DOT_B[LAST] / L_B).toFixed(3)),
    markScreenYAtLast: Number(screenAt(LAST, modelAt(LAST).x, modelAt(LAST).y)[1].toFixed(0)),
    markScreenMax: (() => {
      let my = 0;
      let mf = 0;
      for (let f = 0; f <= LAST; f++) {
        const m = modelAt(f);
        const y = screenAt(f, m.x, m.y)[1];
        if (y > my) {
          my = y;
          mf = f;
        }
      }
      return [Number(my.toFixed(0)), mf];
    })(),
    ringBottomScreenMax: (() => {
      let my = 0;
      let mf = 0;
      for (let f = 0; f <= LAST; f++) {
        const y = screenAt(f, AX, LANE_START_Y)[1];
        if (y > my) {
          my = y;
          mf = f;
        }
      }
      return [Number(my.toFixed(0)), mf];
    })(),
    dotAtLastSpeedPx: Number(speedOf(modelAt, LAST).toFixed(2)),
    atSpeechEnd: {
      k: Number(camAt(SPEECH_END).k.toFixed(4)),
      cy: Number(camAt(SPEECH_END).cy.toFixed(1)),
      model: [Number(modelAt(SPEECH_END).x.toFixed(1)), Number(modelAt(SPEECH_END).y.toFixed(1))],
      frac: Number((DOT_B[SPEECH_END] / L_B).toFixed(3)),
      speed: Number(STATE_AT_SPEECH_END.markSpeed.toFixed(2)),
    },
    /** The most the camera itself moves a fixed world point, and the least:
     *  the cut has no parked frame and no whip. Measured on world (540, 1100),
     *  as a VELOCITY difference, not a speed difference. */
    camMaxPx: (() => {
      const pr = { x: AX, y: 1100 };
      let mx = 0;
      let mdv = 0;
      let mdvF = 0;
      let prev: [number, number] = [0, 0];
      for (let f = 1; f <= LAST; f++) {
        const a = screenAt(f - 1, pr.x, pr.y);
        const b = screenAt(f, pr.x, pr.y);
        const v: [number, number] = [b[0] - a[0], b[1] - a[1]];
        mx = Math.max(mx, Math.hypot(v[0], v[1]));
        if (f > 1 && Math.hypot(v[0] - prev[0], v[1] - prev[1]) > mdv) {
          mdv = Math.hypot(v[0] - prev[0], v[1] - prev[1]);
          mdvF = f;
        }
        prev = v;
      }
      return [Number(mx.toFixed(2)), Number(mdv.toFixed(3)), mdvF];
    })(),
    camSample: [0, 8, 16, 30, 50, 70, 80, 88, 97, LAST].map((f) => ({
      f,
      k: Number(camAt(f).k.toFixed(3)),
      cy: Number(camAt(f).cy.toFixed(1)),
    })),
  };
})();
