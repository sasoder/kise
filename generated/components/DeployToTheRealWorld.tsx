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
  DASH_OFF,
  DASH_ON,
  FakePerson,
  INK,
  INK_HI,
  INK_LO,
  MARCH_W,
  MODEL_EDGE,
  MODEL_MARK,
  MODEL_R,
  ModelDot,
  PERSON_H,
  PersonGlyph,
  STROKE_W,
  THREAD_GAP,
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
// V2 — TWO CHANGES, AND ONLY TWO. (1) THE MODEL IS THE OPENAI MARK, not a dot:
// `trapShared.ModelDot` now draws `brandGlyphs.OPENAI` filled, on a 72 screen px
// em box (MODEL_MARK_PX), in the same two-tone orange on the FILL. This is an
// interview with someone from OpenAI. (2) THE ANSWER KEY is lucide `key-round`
// instead of `key`, and the folder glyph is masked behind its silhouette. Every
// staging, timing, camera, beat and duration in this file is untouched.
// ---------------------------------------------------------------------------
// THIS CUT HAS ITS OWN TALL WORLD. It does not use trapShared's TABLEAU — no
// stations, no folder, no evaluator, no wire, no `Tableau`. It takes the
// module's SIZES, its two ink rungs, `Wall`, `ModelDot`, `PersonGlyph`,
// `FakePerson` and the camera helpers, and lays its own world out over the
// 1080 x 1920 field: the dashed test ring low down at world y 1620, and 726
// world px of REAL WORLD above it. The camera travels UP through that world
// and the payoff is off-frame at f0.
//
// SOUND-OFF READING TEST — one sentence:
//   "a dot weaves a little course past fake people inside a dashed ring; a
//    dashed line runs up out of the ring on exactly the same course, only
//    bigger, between real people; then the dot goes out and rides it, and the
//    line turns solid behind it."
//
// THE IDEA. What the model does inside the (dashed) test is a FORECAST of what
// it will do outside. The test's little course and the real world's big course
// are THE SAME CURVE, the second one 2.2x the first, joined at the gate — the
// forecast is literally the small course continued. The dot then runs it.
//
// VOCABULARY, the clip's, unchanged:
//   the model    = ONE solid orange dot (`ModelDot`, MODEL_R), lit (ACCENT) the
//                  whole cut: it is behaving, i.e. working, throughout. Accent
//                  appears NOWHERE else — no thread, no gaze and no packet is
//                  motivated by this line, so the cut has none of them.
//   the test     = the dashed white ring (`Wall`) with a GAP at its top point:
//                  the gate. Its dashes march from f0 to the last frame.
//   fake people  = `FakePerson` (reveal 1: the glyph at INK_LO inside a dashed
//                  circle) at PERSON_H / 2.2, because the test is a scale model
//                  of the real thing — see DEVIATIONS.
//   real people  = `PersonGlyph`, solid, INK_HI, PERSON_H. NINE of them, hashed,
//                  denser toward the top, never a row.
//   the lane     = white, INK_HI, SOLID, one stroke: the course the model
//                  actually runs, inside the test.
//   the forecast = the same curve x2.2 above the gate, DASHED, INK_LO — it has
//                  not happened yet — converting to SOLID INK_HI behind the dot
//                  as the dot reaches each piece of it.
// Two ink opacities only: INK_HI 1.0 (lane, wall, people, the solid forecast)
// and INK_LO 0.5 (the dashed forecast, the fake people and their circles). No
// text, no numerals, no second dot, no question mark, no people reacting.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion; the words are landings. Nothing in the cut
// is outside this list, and every item names the word it serves.
//
//  1. f0-15   "then you can get"   THE MODEL IS BEHAVING. The cut opens close on
//             (f0/f5/f11/f13)      the test ring — damped k 2.693, the ring 889
//                                  screen px across in a 1080 frame, 95 px of
//                                  side margin — with the mark ALREADY at 58% of
//                                  the lane (t 0.578), clearing the LAST fake
//                                  prop and decelerating into the gate on
//                                  arriveEase. The wall's dashes march, the
//                                  three fake circles' dashes march, and the
//                                  camera is already easing out at f0 (26 frames
//                                  of pre-roll through the damper).
//  2. f15-70  "a sense of, like"   THE FORECAST. On the frame the dot reaches
//             (f15/f17/f22/f25)    the gate, a DASHED INK_LO line starts growing
//                                  out of it — the dot's own curve, continued:
//                                  both are vertical at the gate, so the join is
//                                  C1 and there is no kink. Its head runs the
//                                  big slalom and the CAMERA FOLLOWS IT
//                                  (k 2.693 -> 1.319, content centre 1622 ->
//                                  1075) while real people come into frame from
//                                  above and the line threads between them. The
//                                  head lands at the top of the crowd on f70,
//                                  two frames before "well" (f72). That run is
//                                  "okay is the AI actually going to behave
//                                  well" (f31/f37/f47/f54/f67/f72).
//  3. f15-80  "it is not deployed  THE LAP. The dot holds at the gate for two
//             yet"                 frames (it looks out, f15-16), then runs 60% of
//                                  the lane back DOWN — re-weaving all three props,
//                                  which are still in frame — and up again,
//                                  arriving at the gate at f80 with 9.6 world
//                                  px/frame still on it, so the deployment is
//                                  the same motion continuing. It is inside the
//                                  test the whole time the forecast is drawn.
//  4. f70-88  "when we deploy"     THE PULL-BACK. One glide out to the resolved
//             (f76/f80)            framing (k 1.319 -> 1.000, content centre
//                                  1075 -> 1256.3), landing on f88, one frame
//                                  before "real" (f89), holding the WHOLE
//                                  picture: the small dashed ring at the bottom,
//                                  the lane up through the crowd, content centre
//                                  on screen y 835.
//  5. f80-113 "in the real world"  THE DEPLOYMENT. On "deploy" (f80) the dot
//             (f86/f89/f92)        goes OUT through the gap in the wall and
//                                  rides the forecast, and behind it the line
//                                  converts dashed INK_LO -> solid INK_HI,
//                                  because the dot has reached it. It is 63% of
//                                  the way up on the last frame and still moving
//                                  at 20.4 screen px/frame, still weaving, still
//                                  touching no one.
//
// LIVENESS — mechanisms, not gestures; none is on a word and none ever stops:
// the wall's marching dashes (and the three fake circles', and the forecast's),
// `breath` on the model, the dot moving on every single frame of the cut, the
// grid's parallax and its own -0.3 px/frame drift, and a camera whose decaying
// drift is still running at DURATION (0.305 screen px on the slowest frame,
// against the set's 0.15 "parked" floor).
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
// one scaled 2.2x about the gate point — the same shape in the same handedness,
// not a reflection. Arc lengths, tabulated over 900 samples: 423.6 world px and
// 931.9, and everything that travels on either is parametrised BY ARC LENGTH.
//
// THE WORLD, in world px (the resolved camera's k = 1, so world px = screen px
// there):
//   wall        centre (540, 1620), r 165, with a GAP at its top point: the
//               `draw` 0.927 wipe leaves 75.7 world px of gate — a chord half-
//               width of 37.5 — and the mark is 55.4 world px across, so it
//               passes with 10.2 px either side. (It was `draw` 0.95 and a
//               32.3 px dot; the 55.4 px mark does not fit through that gate at
//               all, and WALL_DRAW is the one number this cut changed for it.)
//   small lane  from (540, 1785) — the wall's bottom point — to the gate at
//               (540, 1455). H_S = 330 = the ring's diameter, A_S = 35.
//   fake props  on the lobes, at x 540 +- 62, y 1699.2 / 1620 / 1540.8, h 41.26.
//   big lane    the same curve x2.2 out of the gate: H_B = 726, A_B = 77, its
//               top at (540, 729).
//   the crowd   nine people, PERSON_H 90.77, at
//                 (404,1092) (676,918) (384,759) (627,811) (809,835)
//                 (365,934)  (766,1037) (288,1123) (798,1251)
//               The first two are the people standing opposite the big lane's
//               second and third lobes — the rhyme with the fake props. The rest
//               come off a 4 x 6 lattice whose columns are staggered half a step
//               in y and whose seats are jittered by 1.3 of their own step, with
//               the acceptance rising as (height)^1.4 toward the top, so the
//               crowd is denser up there and never sits on a rule. Rejected: any
//               seat whose ink comes within PERSON_INK/2 + MODEL_R + 18 of the
//               lane, within 104 of an accepted seat, or more than 330 from the
//               centre column.
//
// ---------------------------------------------------------------------------
// CAMERA — knots on ONE monotone cubic Hermite (`camKnots3`, Fritsch-Carlson,
// one key per frame, cy taken off the eased k) through the shared damper
// (`runCam3`). cx is 540 on every knot: the composition is a centred column, so
// the camera only tilts and zooms. 26 frames of PRE-ROLL run through the damper
// before frame 0, so f0 is already moving instead of standing still.
//
//   knot f -26   k 2.840  c 1652     PRE-ROLL
//   knot f   0   k 2.630  c 1622     close on the ring, already easing out
//   knot f  22   k 1.920  c 1505     THE CREEP, under "sense of like": the gate
//                                    lifts toward the middle of the frame as the
//                                    forecast leaves it
//   knot f  48   k 1.520  c 1180     THE FOLLOW, carrying velocity through
//   knot f  70   k 1.270  c 1075     ...landing with the head on "well"
//   knot f  88   k solved c 1256.3   THE PULL-BACK to the resolved framing, one
//                                    frame before "real" (f89)
//   knot f 112   k -0.014  c   +8    still drifting on the last frame
//   knot f 180   k -0.045  c  +26    the drift's continuation, off the end
// K_END is SOLVED (secant) so the damped camera reads exactly K_REST = 1.000 on
// the last frame. Damped, measured: f0 2.693 · f15 2.290 · f30 1.843 ·
// f50 1.548 · f70 1.319 · f80 1.173 · f88 1.052 · f112 1.000.
//
// ---------------------------------------------------------------------------
// MEASURED (STATS, audited over every frame; screen px at each frame's own
// camera, so every number below includes the camera's own motion):
//   forecast head, fastest frame     33.8 px/f   (ceiling 45, at f27)
//   the model mark, fastest frame    39.0 px/f   (ceiling 45, at f1)
//   the camera on world (540,1100)   29.0 px/f peak, |dv| 1.77 px/f^2 peak
//                                    (the set's |dv| ceiling is 2.2)
//   slowest frame of the whole cut   0.305 px/f  (the "parked" floor is 0.15)
//   mark to a fake prop's circle     11.8 world px, closest over every frame
//                                    (23.4 with the old dot: the mark's half-box
//                                    is 11.5 px bigger than MODEL_R and that is
//                                    the whole of the difference — 32 screen px
//                                    of daylight at the opening camera, 12 at
//                                    rest, and no prop is ever touched)
//   mark to a real person's ink      70.7 world px, closest over every frame
//   gate, per side, at the mark      7.5 world px of stroke-to-ink clearance
//                                    (10.2 px of arc either side of it)
//   resolved ink                     screen y 292.3 .. 1365.9 (band 300..1400;
//                                    the top 8 px over is the crowd's topmost
//                                    head, which is not what the caption rule
//                                    protects)
//   side margin at rest              229.7 px    (brief asks >= 70)
//   the crowd at f0                  lowest person's feet at world y 1296.4,
//                                    the frame's top edge at 1321.8: the payoff
//                                    is entirely off-frame
//   the dot at DURATION - 1          63% up the big course, 20.4 px/f
//   sizes, open -> rest              wall 889 -> 330 px, stroke 12.4 -> 4.6,
//                                    a fake prop 111.1 px tall at the open, a
//                                    real person 90.8 at rest, the mark's em box
//                                    149.1 -> 55.4
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//   * THE RESOLVED CAMERA IS k 1.000, NOT 0.66, AND THE WALL IS r 165, NOT 250.
//     These are the same decision. trapShared fixes every noun's WORLD size
//     against K_REF 1.3, and this cut has to hold the ring, a copy of its course
//     2.2x bigger and a crowd in ONE frame inside the caption band. The ink
//     column is 6.4 * r + PERSON_H/2 + STROKE_W/2 world px tall and the band
//     300..1400 with the content centre at 835 allows about 1100 screen px, so
//         k * (6.4 r + 47.7) ~= 1100.
//     One of k and r is free. Taking k = 1.000 — CAM_WIDE's own zoom, which the
//     module states is an accepted framing (x0.77 of the nominal screen sizes:
//     person 90.8 px, the mark 55.4 px, stroke 4.6 px) — gives r = 165, and every
//     noun then keeps the module's world size verbatim, dash pattern included.
//     Taking the brief's r = 250 instead forces k = 0.631, where a person is 57
//     screen px and the model 20: at the 270 px reading test that is a 14 px
//     person and a 5 px dot, and the cut fails it. Scaling the nouns up in world
//     instead was rejected because `Wall`'s and `FakePerson`'s dash pattern is
//     not a prop, so the dashes alone would have come out 0.77x against their
//     own strokes. Consequence, stated plainly: the wall is 330 screen px across
//     here and 884 in cut 3. It is the same ring — this cut's whole job is to
//     pull away from it, so what changed is the camera, not the noun.
//
//   * A FAKE PERSON IS PERSON_H / 2.2, NOT PERSON_H. The test's course is the
//     real one at 1/2.2, so its props are too: the test is a scale model, which
//     is what makes the two slaloms read as the same course. At the opening
//     camera a fake prop is 111 screen px tall, i.e. rather more than the 90.8
//     px a real person reads at the resolved camera — each is "a person" at the
//     moment the camera is on it. Full-size props cannot be done at all: three
//     of them is 272 world px of glyph stacked inside a ring 330 world px
//     across, before the lane that has to weave around them.
//
//   * THE SLALOM SITS IN THE MIDDLE 72% OF THE COURSE. Run edge to edge, its
//     third lobe lands 55 world px below the gate, and the lane coming back to
//     the axis for the gate then passes 12 world px from that prop's circle —
//     it clips it. Pulling the lobes into the middle puts 85.8 world px of
//     straight run between the last prop and the gate and takes the closest
//     approach to 23.4, and it is also what gives the two courses a vertical
//     tangent to join on.
//
//   * THE PROPS ALTERNATE SIDES (x 540 +- 62) INSTEAD OF STANDING ON THE AXIS.
//     A prop on the axis is 31.8 world px of circle either side of it, and the
//     lane crosses the axis 39.6 px above and below every lobe, so the dot
//     (MODEL_R 16.2) overlaps it there whatever the amplitude is. Offsetting the
//     props by 62 and the lane by 35 the other way gives 97 world px of
//     separation at the lobes and sqrt(62^2 + 39.6^2) = 73.6 at the crossings —
//     a measured worst case of 23.4 px of daylight — at 3 pi * 35 / 237.6 = 24
//     degrees off vertical, where props on the axis need 60 degrees and read as
//     a zigzag rather than a slalom. Everything stays inside the wall: the worst
//     extent is a prop circle at 132.4 of the 162.7 world px the wall's inner
//     edge allows.
//
//   * THE DOT SHUTTLES THE LANE RATHER THAN CIRCLING IT. The brief asks the dot
//     to "circle back onto its course"; a return arc would have to run between
//     the prop circles (132.4) and the wall (162.7), which is 30 world px of
//     room. So it reaches the gate on f15, holds three frames, runs 60% of the
//     way back down — re-weaving all three props, which are still in frame —
//     and comes up again, arriving at the gate on f80 with its speed still on
//     it. Both turns are eased; the far turn (f49) is the one gesture the camera
//     has already left behind. 60% and not 100%: the camera is travelling UP
//     through those frames and the dot is travelling DOWN, so their screen
//     speeds ADD, and a full-length descent measured 68 screen px/frame.
//
//   * THE HEAD AND THE DOT ARE BOTH CAPPED AGAINST THE CAMERA. Speeds are
//     integrated per frame at min(V, 42 / k(f)), so nothing is ever over the
//     set's 45 screen px/frame however tight the camera is, and V is SOLVED
//     (bisection) so the head still lands exactly on f70 and the dot leaves
//     exactly on f80.
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

const WORLD_W = 1080;
const WORLD_H = 1920;
const AX = 540;
const LAST = DURATION - 1;

// --- the world --------------------------------------------------------------
const K_REST_TARGET = 1.0; // = CAM_WIDE's zoom; see DEVIATIONS
const R_WALL = 165;
const WALL_C = { x: AX, y: 1620 };
const GATE = { x: AX, y: WALL_C.y - R_WALL }; // 1455
const LANE_START_Y = WALL_C.y + R_WALL; // 1785
const SCALE_UP = 2.2;
const H_S = 2 * R_WALL; // 330
const A_S = 35;
const P_S = 62; // the props' offset, the other way
const END_TAPER = 0.13;
/** The slalom sits in the MIDDLE of the course; the course runs straight into
 *  the gate at one end and out of the start at the other. See DEVIATIONS. */
const SLALOM_0 = 0.14;
const SLALOM_1 = 0.86;
/** The gap left at the top of the wall for the gate, as a fraction of it.
 *  SOLVED against the mark, not chosen: the gate's chord half-width is
 *  R_WALL * sin((1 - WALL_DRAW) * pi), and it has to clear the mark's half-box
 *  (MODEL_EDGE 27.69) plus half the wall's stroke plus the 7.4 world px of air
 *  the 42 px DOT used to pass with. 0.95 gave 25.8 world px of half-chord, which
 *  the 55.4 px mark does not fit through at all; 0.927 gives 37.5, i.e. 10.2
 *  world px of daylight either side of the mark — the same daylight the dot had.
 *  V2: the ONLY number this cut changed for the mark. */
const WALL_DRAW = 0.927;

const FAKE_H = PERSON_H / SCALE_UP; // 41.26
const FAKE_RING_R = FAKE_H * 0.66; // FakePerson's own geometry
/** person.png's ink is 0.84 of its box, so this is a glyph's ink half-width. */
const PERSON_INK_HW = PERSON_H * 0.42;

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

const smallPt = (t: number) => ({ x: AX + shapeX(t), y: LANE_START_Y + shapeY(t) });
const bigPt = (t: number) => ({
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
const FAKE_PROPS = LOBES.map(smallProp);

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
const TAB_S = tabulate(smallPt);
const TAB_B = tabulate(bigPt);
const L_S = TAB_S[CURVE_N];
const L_B = TAB_B[CURVE_N];

/** The curve parameter at arc length `s`, by binary search on the table. */
const tAtS = (tab: Float64Array, s: number) => {
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
// THE CROWD. A 3 x 4 jittered lattice over the upper part of the big course,
// with the acceptance rising toward the top (denser up there, feathered out at
// the bottom), plus the two people that stand opposite the big lane's second
// and third lobes. Every seat is rejected if its ink comes within
// PERSON_INK_HW + MODEL_R + 18 of the lane, or within MIN_GAP of an accepted
// one. Nothing is a row: the lattice is jittered by 90% of its own step and the
// two lobe people are off it entirely.
//
// LANE_CLEAR STILL USES MODEL_R — the old 42 px dot's radius — and not the
// mark's half-box. It is the seed of a SOLVER, not a clearance: widening it
// would reject seats and move nine people, which this revision does not do. The
// clearance itself is MEASURED against the mark and comes out at 70.7 world px
// (`STATS.minRealClear`), so nothing is tight.
// ---------------------------------------------------------------------------
const CROWD_TOP = 740;
const CROWD_BOT = 1258;
const CROWD_HX = 330; // |x - AX| ceiling for a centre
const LANE_CLEAR = PERSON_INK_HW + MODEL_R + 18;
const MIN_GAP = 104;

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

const CROWD: Seat[] = (() => {
  const out: Seat[] = [];
  const push = (s: Seat) => {
    for (const o of out) {
      if (Math.hypot(o.x - s.x, o.y - s.y) < MIN_GAP) return false;
    }
    if (laneDist(s.x, s.y) < LANE_CLEAR) return false;
    if (Math.abs(s.x - AX) > CROWD_HX) return false;
    if (s.y < CROWD_TOP || s.y > CROWD_BOT) return false;
    out.push(s);
    return true;
  };
  // the two that stand opposite the lane's lobes: the rhyme with the props
  push(bigProp(LOBES[1]));
  push(bigProp(LOBES[2]));
  // the lattice, top row first, so the density falls downward
  const COLS = 4;
  const ROWS = 6;
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
      if (hash(id, 13) > 0.2 + 0.8 * Math.pow(clamp01(up), 1.4)) continue;
      seats.push({ s: { x, y }, q: y });
    }
  }
  seats.sort((a, b) => a.q - b.q);
  for (const s of seats) {
    if (out.length >= 9) break;
    push(s.s);
  }
  return out;
})();

// --- the ink's own extent, which is what the resting camera frames -----------
const INK_BOTTOM = LANE_START_Y + STROKE_W / 2;
const INK_TOP = Math.min(
  bigPt(1).y,
  ...CROWD.map((p) => p.y - PERSON_H / 2),
);
const C_REST = (INK_TOP + INK_BOTTOM) / 2;

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
const PRE = 26;
const KNOTS = (kEnd: number) => [
  { f: 0, k: 2.84, x: AX, y: 1652 },
  { f: PRE, k: 2.63, x: AX, y: 1622 },
  { f: PRE + 22, k: 1.92, x: AX, y: 1505 },
  { f: PRE + 48, k: 1.52, x: AX, y: 1180 },
  { f: PRE + 70, k: 1.27, x: AX, y: 1075 },
  { f: PRE + 88, k: kEnd, x: AX, y: C_REST },
  { f: PRE + 112, k: kEnd - 0.014, x: AX, y: C_REST + 8 },
  { f: PRE + 180, k: kEnd - 0.045, x: AX, y: C_REST + 26 },
];

const trackFor = (kEnd: number) => camKnots3(KNOTS(kEnd), PRE + DURATION + 70);
const kAtLast = (kEnd: number) => {
  const t = trackFor(kEnd);
  return runCam3(LAST + PRE, t.CX, t.CY, t.K).k;
};
const K_END = (() => {
  const a = 0.9;
  const b = 1.1;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom the whole cut is written against. */
const K_REST = kAtLast(K_END);
const CAM = trackFor(K_END);

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
const camAt = (f: number) => CAM_AT_F[clampF(f)];
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

const F_GATE = 15; // the dot reaches the gate — "a sense" (f15/f17)
const F_TURN = 17; // ...holds, then runs back
const F_BOTTOM = 49; // the far turn
const T_TURN = 0.4; // how far back down the course the dot runs before it turns
const F_DEPLOY = 80; // "deploy"
const F_HEAD_END = 70; // the forecast head lands — two frames before "well"
const END_FRACTION = 0.63; // where the dot is on the big course at DURATION - 1

/** A normalised speed profile: eased ramp in over `r0`, eased ramp out over
 *  `r1`, flat between. Its integral over [0, 1] is 1 - (r0 + r1) / 2. */
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
  let hi = 200;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (reach(mid) < dist) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

// --- the forecast head: out of the gate on f15, landing on f70 --------------
const HEAD_SHAPE = (t: number) => profile(t, 0.14, 0.22);
const V_HEAD = solveV(F_GATE, F_HEAD_END, L_B, HEAD_SHAPE);
const HEAD_S: number[] = (() => {
  const run = integrate(F_GATE, F_HEAD_END, (f) =>
    V_HEAD * HEAD_SHAPE((f - F_GATE) / (F_HEAD_END - F_GATE)),
  );
  const out: number[] = new Array(DURATION + 3).fill(0);
  for (let f = 0; f <= DURATION + 2; f++) {
    out[f] = f < F_GATE ? 0 : f >= F_HEAD_END ? L_B : Math.min(L_B, run[f - F_GATE]);
  }
  return out;
})();

// --- the dot ----------------------------------------------------------------
// Leg 1  f0..f15    it is already running: arriveEase into the gate, so the
//                   deceleration into the hold is the end of a motion that
//                   started before the cut did.
// Leg 2  f15..f18   the hold at the gate.
// Leg 3  f18..f49   back down the lane, eased at both ends.
// Leg 4  f49..f80   up again, eased out of the bottom turn and NOT decelerating
//                   at the gate: it carries its speed into the deployment.
// Leg 5  f80..       the big course.
const DOWN_SHAPE = (t: number) => profile(t, 0.1, 0.22);
const UP_SHAPE = (t: number) => profile(t, 0.32, 0);
const LEG_DIST = L_S * (1 - T_TURN);
const V_DOWN = solveV(F_TURN, F_BOTTOM, LEG_DIST, DOWN_SHAPE);
const V_UP = solveV(F_BOTTOM, F_DEPLOY, LEG_DIST, UP_SHAPE);

/** How far back the dot starts: the distance arriveEase can cover in F_GATE
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
/** The speed the dot arrives at the gate with, so leg 5 continues it. */
const V_GATE = UP_RUN[F_DEPLOY - F_BOTTOM] - UP_RUN[F_DEPLOY - F_BOTTOM - 1];

const BIG_RAMP = 12;
const V_BIG = (() => {
  const reach = (V2: number) => {
    let s = 0;
    for (let f = F_DEPLOY + 1; f <= LAST; f++) {
      const v = V_GATE + (V2 - V_GATE) * smoothstep(clamp01((f - F_DEPLOY) / BIG_RAMP));
      s += Math.min(v, HEAD_CAP / kAt(f));
    }
    return s;
  };
  let lo = V_GATE;
  let hi = 60;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (reach(mid) < END_FRACTION * L_B) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

/** The dot's arc on the SMALL course (0..L_S) per frame; -1 once deployed. */
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

/** The dot's arc on the BIG course from F_DEPLOY; -1 before it. */
const DOT_B: number[] = (() => {
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
const modelAt = (f: number) => {
  const i = clampF(f);
  if (DOT_B[i] >= 0) return bigPt(tAtS(TAB_B, DOT_B[i]));
  return smallPt(tAtS(TAB_S, Math.max(0, DOT_S[i])));
};

// --- paths ------------------------------------------------------------------
const pathOf = (pt: (t: number) => { x: number; y: number }, t0: number, t1: number) => {
  const steps = Math.max(2, Math.ceil(Math.abs(t1 - t0) * 220));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = pt(t0 + (t1 - t0) * (i / steps));
    d += `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
};
const LANE_D = pathOf(smallPt, 0, 1);

/** The disc the mark takes out of its own course, and the mask that does it.
 *  THREAD_GAP — the module's own "outside the mark" radius, 30.46 world px —
 *  so the lane stops exactly where an accent thread starts in the other cuts,
 *  and the mark's 5% breath (up to a 29.08 world px half-box) still never
 *  reaches it. */
const MODEL_HOLE = THREAD_GAP;
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
                  from where the dot has got to up to the head, so the moment the
                  dot reaches a piece of it, it stops being a forecast. */}
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

              {/* ...and the part of it the dot has already made true: SOLID,
                  INK_HI, behind the dot. */}
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
                  actually runs. */}
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

            {/* THE TEST ENVIRONMENT: the dashed ring, with the gate left open
                at its top point by the wipe. */}
            <Wall
              k={k}
              cx={WALL_C.x}
              cy={WALL_C.y}
              r={R_WALL}
              draw={WALL_DRAW}
              march={frame}
              opacity={INK_HI}
            />
          </svg>

          {/* (2) the people. The fake ones are the real ones at 1/2.2 — the
              test is a scale model — and they are dim, inside dashed circles
              whose dashes march on the same clock as the wall's. */}
          {FAKE_PROPS.map((p, i) => (
            <FakePerson
              key={`fp${i}`}
              k={k}
              frame={frame}
              x={p.x}
              y={p.y}
              h={FAKE_H}
              reveal={1}
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
export const ACCENT_USED_BY = "the model dot only";
export const BEAT_CHECK = {
  sense: defaultProps.beats.sense,
  well: defaultProps.beats.well,
  deploy: defaultProps.beats.deploy,
  real: defaultProps.beats.real,
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
  // the camera: screen speed of a fixed world point, and its own jerk
  const probe = { x: AX, y: WALL_C.y };
  const camSpeed: number[] = [];
  for (let f = 1; f <= LAST; f++) {
    const a = screenAt(f - 1, probe.x, probe.y);
    const b = screenAt(f, probe.x, probe.y);
    camSpeed.push(Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  let maxDv = 0;
  for (let i = 1; i < camSpeed.length; i++) {
    maxDv = Math.max(maxDv, Math.abs(camSpeed[i] - camSpeed[i - 1]));
  }
  // the clearance the dot keeps from every prop and every person
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
  const inkTop = screenAt(lastF, AX, INK_TOP)[1];
  const inkBot = screenAt(lastF, AX, INK_BOTTOM)[1];
  let minMargin = Infinity;
  for (const p of CROWD) {
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
  const lowestPerson = Math.max(...CROWD.map((p) => p.y + PERSON_H / 2));
  // the wall's extents at the widest and tightest zooms
  return {
    kRest: Number(K_REST.toFixed(5)),
    kEnd: Number(K_END.toFixed(5)),
    kOpen: Number(CAM_AT_F[0].k.toFixed(4)),
    strokeScreenRest: Number((STROKE_W * K_REST).toFixed(2)),
    strokeScreenOpen: Number((STROKE_W * CAM_AT_F[0].k).toFixed(2)),
    personScreenRest: Number((PERSON_H * K_REST).toFixed(1)),
    fakeScreenOpen: Number((FAKE_H * CAM_AT_F[0].k).toFixed(1)),
    markScreenRest: Number((MODEL_MARK * K_REST).toFixed(1)),
    markScreenOpen: Number((MODEL_MARK * CAM_AT_F[0].k).toFixed(1)),
    wallScreenOpen: Number((2 * R_WALL * CAM_AT_F[0].k).toFixed(0)),
    wallScreenRest: Number((2 * R_WALL * K_REST).toFixed(0)),
    /** the gate's chord half-width against the mark's half-box */
    gateHalfChord: Number((R_WALL * Math.sin((1 - WALL_DRAW) * Math.PI)).toFixed(1)),
    gateClearPerSide: Number(
      (R_WALL * Math.sin((1 - WALL_DRAW) * Math.PI) - MODEL_EDGE - STROKE_W / 2).toFixed(1),
    ),
    laneLenSmall: Number(L_S.toFixed(1)),
    laneLenBig: Number(L_B.toFixed(1)),
    crowd: CROWD.length,
    crowdSeats: CROWD.map((p) => [Math.round(p.x), Math.round(p.y)]),
    gateGapWorld: Number(((1 - WALL_DRAW) * 2 * Math.PI * R_WALL).toFixed(1)),
    sStart: Number(S_START.toFixed(1)),
    tStart: Number(tAtS(TAB_S, S_START).toFixed(3)),
    vHead: Number(V_HEAD.toFixed(2)),
    vDown: Number(V_DOWN.toFixed(2)),
    vUp: Number(V_UP.toFixed(2)),
    vGate: Number(V_GATE.toFixed(2)),
    vBig: Number(V_BIG.toFixed(2)),
    maxHeadPx: Number(maxHead.toFixed(2)),
    maxHeadF,
    maxDotPx: Number(maxDot.toFixed(2)),
    maxDotF,
    minCamPx: Number(Math.min(...camSpeed).toFixed(3)),
    maxCamDv: Number(maxDv.toFixed(3)),
    minFakeClear: Number(minFake.toFixed(1)),
    minRealClear: Number(minReal.toFixed(1)),
    inkTopScreen: Number(inkTop.toFixed(1)),
    inkBottomScreen: Number(inkBot.toFixed(1)),
    sideMarginRest: Number(minMargin.toFixed(1)),
    topWorldF0: Number(topWorldF0.toFixed(1)),
    lowestPersonBottom: Number(lowestPerson.toFixed(1)),
    crowdHiddenAtF0: lowestPerson < topWorldF0,
    headLandsAt: F_HEAD_END,
    dotFracAtLast: Number((DOT_B[LAST] / L_B).toFixed(3)),
    dotAtLastSpeedPx: Number(speedOf(modelAt, LAST).toFixed(2)),
    minFakeAt: (() => {
      let best = Infinity;
      let where: number[] = [];
      for (let f = 0; f <= LAST; f++) {
        const m = modelAt(f);
        for (let i = 0; i < FAKE_PROPS.length; i++) {
          const p = FAKE_PROPS[i];
          const d =
            Math.hypot(m.x - p.x, m.y - p.y) - MODEL_EDGE - (FAKE_RING_R + STROKE_W / 2);
          if (d < best) {
            best = d;
            where = [f, i, Math.round(m.x), Math.round(m.y)];
          }
        }
      }
      return where;
    })(),
    /** The most the camera itself moves a fixed world point, and the least:
     *  the cut has no parked frame and no whip. Measured on world (540, 1100),
     *  as a VELOCITY difference, not a speed difference — the pull-back reverses
     *  that point's direction, and |d|v|| overstates a clean zero crossing. */
    camMaxPx: (() => {
      const probe = { x: AX, y: 1100 };
      let mx = 0;
      let mdv = 0;
      let prev: [number, number] = [0, 0];
      for (let f = 1; f <= LAST; f++) {
        const a = screenAt(f - 1, probe.x, probe.y);
        const b = screenAt(f, probe.x, probe.y);
        const v: [number, number] = [b[0] - a[0], b[1] - a[1]];
        mx = Math.max(mx, Math.hypot(v[0], v[1]));
        if (f > 1) mdv = Math.max(mdv, Math.hypot(v[0] - prev[0], v[1] - prev[1]));
        prev = v;
      }
      return [Number(mx.toFixed(2)), Number(mdv.toFixed(3))];
    })(),
    camSample: [0, 15, 30, 50, 70, 80, 88, 100, LAST].map((f) => ({
      f,
      k: Number(camAt(f).k.toFixed(3)),
      cy: Number(camAt(f).cy.toFixed(1)),
    })),
  };
})();
