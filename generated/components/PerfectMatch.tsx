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
  TWO_PI,
  Wall,
  camKnots3,
  runCam3,
} from "./trapShared";
import {
  AX,
  CAM_KNOTS,
  CROWD,
  FAKE_H,
  FAKE_PROPS,
  GATE,
  GRID_CY_REF,
  H_S,
  K_END,
  LANE_D,
  LANE_START_Y,
  L_B,
  MODEL_HOLE,
  PRE,
  R_WALL,
  SCALE_UP,
  SPEECH_END,
  STATE_AT_SPEECH_END,
  TAB_B,
  WALL_C,
  WALL_DRAW,
  WORLD_H,
  WORLD_W,
  bigPt,
  pathOf,
  smallPt,
  tAtS,
} from "./DeployToTheRealWorld";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Trap`, cut 2 `PerfectMatch` — the line that follows
// cut 1 straight on, at SRT in-point 6.339 s:
//   "like, if you just have a perfect evaluation / real-world deployment match,
//    then that's the path."
//
// DURATION. frame = round((t - 6.339) * 24):
//   like f0 · if f1 · you f3 · just f5 · have f7 · a f10 · perfect f13 ·
//   evaluation f20 (ends f36) · real f36 · world f49 · deployment f53 ·
//   match f61 (ends f77) · then f77 · that's f83 · the f95 · path f97 (ends
//   f105)
// Speech runs f0..105 and the set's 16-frame tail holds the resolved state:
// DURATION = 105 + 16 = 121. The next line — "the challenge is how do you make
// it sufficiently realistic" — is NOT covered here; the tail holds, alive.
export const DURATION = 121;

// ---------------------------------------------------------------------------
// THIS CUT BUTTS AGAINST CUT 1. The editor lays it on its in-point, which
// lands ON TOP of `DeployToTheRealWorld`'s 16-frame tail, so this cut's f0 is
// cut 1 at its SPEECH-END frame (97) and not at its last. Everything here is
// therefore cut 1 CONTINUED, not re-staged:
//   * the world is cut 1's own — imported, never restated: the ring at (540,
//     1600) r 200 with its gate, the small lane, the three converted props, the
//     twelve people, and the real course, the same curve x2.0 out of the gate.
//   * every clock runs on cut 1's frame numbers: this cut's frame f is cut 1's
//     frame `g = 97 + f`, and `g` is what drives the marching dashes, the mark's
//     breath, the camera's sway, the grid's drift and the camera itself.
//   * the camera is cut 1's camera, continued: the same knots up to its
//     resting-drift knot, the same monotone Hermite, the same damper run from
//     the same f = 0, with this cut's three moves hung off the end. Measured at
//     the join: k differs by 0.022% and cy by 0.25 world px, i.e. a third of a
//     screen px (`STATS.join`). Rendered, cut 1's f97 and this cut's f0 differ
//     on 0.5% of their pixels, 99.9% of which sit on an ink edge: it is the same
//     frame, re-antialiased.
//   * at f0 the mark is 15.5% up the real course doing 9.9 world px/frame, the
//     line behind it is solid and the forecast ahead of it is still dashed —
//     which is exactly where cut 1 leaves them. Its first frame here advances it
//     by 9.89 world px against cut 1's own last 9.905: the ride is continuous
//     through the join, not restarted.
//
// SOUND-OFF READING TEST — one sentence:
//   "the little course inside the test lifts off as a dashed copy, grows until
//    it is the same size as the big one outside, settles exactly onto it and
//    disappears into it, and the model rides the line that is left."
//
// THE IDEA. "A perfect evaluation / real-world deployment match" is not a
// statement about two numbers, it is a statement about two SHAPES: the test's
// course and the real world's course are the same course at different scales,
// and a perfect match is the one where the first, blown up, lies exactly on the
// second. So the cut performs that similarity — the very transform cut 1 built
// the two curves out of — and when the copy lands, the dashed forecast ahead of
// the model becomes the solid path: prediction and reality are one line.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion, two landings. Nothing in the cut is outside
// this list, and every item names the word it serves.
//
//  1. f0-121  "the mark never stops"  THE RIDE. The model rides the real course
//                                     on every frame of the cut, carrying cut
//                                     1's own 9.9 world px/frame across the join.
//                                     It eases back to 6.0 while the copy is the
//                                     subject, opens up to 10.9 for the path, and
//                                     is the only accent in the cut — no thread,
//                                     no gaze, no packet is motivated by this
//                                     line. Fastest frame 13.6 screen px.
//  2. f5-34   "a perfect evaluation"  THE LIFT. A DASHED INK_HI copy of the test
//             (f5/f7/f10/f13)         lane detaches from the solid lane — at f5
//                                     it is exactly on top of it, so there is
//                                     nothing to see until it moves — and rises
//                                     out through the gate, its anchor sliding
//                                     from the ring's bottom point to the gate
//                                     while it scales up. Dashed because it is
//                                     the evaluation's version of the course: a
//                                     simulation of the real one. Its far end is
//                                     the fastest thing in the cut, at 42 screen
//                                     px/frame on f16.
//  3. f8-62   "evaluation ... match"  THE SCALE. One ramp, 1x -> 2.0x, the same
//             (f20/f36/f49/f53)       similarity that relates the two courses:
//                                     eased in, fast while the copy is clear of
//                                     the real course (1.72x by f34, its far end
//                                     still 146 screen px short of the course's)
//                                     and then decaying at a constant relative
//                                     rate, which is what walks the seam up the
//                                     course by a constant factor a frame.
//  4. f34-62  "real-world deployment  THE SEATING. With its anchor home on the
//             match" (f61)            gate, the copy comes into register with the
//                                     real course FROM THE BOTTOM UP — the error
//                                     is proportional to the distance from the
//                                     gate, because the two are the same shape at
//                                     different sizes — and wherever copy and
//                                     course are within 2 world px of each other
//                                     the copy is ABSORBED. The test is where
//                                     they touch, not a clock: `absorbedTo`
//                                     bisects the actual distance every frame. So
//                                     it disappears INTO the line dash by dash:
//                                     the seam is 9% up the course on f45, 18% on
//                                     f50, 37% on f55 and home on f62, on "match"
//                                     (f61-77). Behind it the forecast stops
//                                     being dashed INK_LO and becomes the solid
//                                     INK_HI path, ahead of the model as well as
//                                     behind it.
//  5. f70-100 "then that's the path"  THE LAST GLIDE. The model opens up from 6.0
//             (f77/f83/f95/f97)       to 10.9 world px/frame and runs the rest of
//                                     the course; the camera follows it up, so
//                                     all twelve people pass down the frame on
//                                     both sides and the ring sinks out of the
//                                     bottom of it (its top edge is on screen y
//                                     1480 on the last frame and its bottom is
//                                     off the frame). The path is what the cut
//                                     ends on.
//  6. f105-121 the tail               The model still riding, eased back to 0.8
//                                     of its run and never stopped (9.5 screen
//                                     px/frame on the last frame), the ring's
//                                     dashes marching, the grid drifting, the
//                                     camera still creeping.
//
// CAMERA — two moves on cut 1's own spline, both of them tilt: k stays at K_END
// throughout, so a person is 118.7 screen px and the mark 72.5 on every frame of
// both cuts and nothing changes size across the join.
//   knot f 15  (cut 1's own)  c C_REST+8   cut 1's resting drift, inherited
//   knot f 50  c 1250         THE LIFT'S GLIDE, up with the copy: it keeps the
//                             gate and the whole real S in frame for the match
//   knot f 100 c 950          THE FOLLOW, up with the model
//   knot f 145 c 880          the drift's continuation, off the end
// Damped, measured (cy): f0 1505.9 · f31 1483.7 · f50 1375.2 · f62 1303.6 ·
// f77 1201.5 · f105 1038.9 · f120 1002.1. The camera's own screen speed peaks at
// 9.1 px/frame with |dv| 0.43 px/frame^2 — this cut is a long slow rise, and
// what carries the speed at the end is the crowd passing, not the camera.
//
// DEVIATIONS, with the arithmetic.
//   * THE MODEL RUNS PAST THE END OF THE DRAWN COURSE (T_MAX 1.12). 121 frames
//     at a speed that starts at cut 1's 9.9 world px/frame cannot fit inside the
//     867 world px of course this cut inherits without the model crawling — and
//     "then that's the path" is the one beat that wants it opening up. Past t 1
//     the curve is its own straight continuation (the slalom ends at t 0.86), so
//     the model rides on and the solid line behind it is the path it is making:
//     the line never stops in mid-air, it ends at the model.
//   * THE LAST 26% OF THE SEAM GOES IN TWO FRAMES (f60 -> f62), which measures
//     164 screen px/frame against the set's 45 ceiling. It is not a head: by f60
//     the copy is within 3 screen px of the course over its whole length
//     (`STATS.tipGapPx`), so what is moving that fast is the boundary between
//     two lines that are already on top of each other. The visible motion there
//     is the last two dashes fading into the line.
//
// ---------------------------------------------------------------------------
// See `STATS` at the foot of this file: the join, the speeds, the seating's
// front, the clearances and the resolved frame are all measured there.
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
    like: z.number(),
    just: z.number(),
    perfect: z.number(),
    evaluation: z.number(),
    real: z.number(),
    world: z.number(),
    deployment: z.number(),
    match: z.number(),
    then: z.number(),
    thats: z.number(),
    path: z.number(),
    end: z.number(), // speech ends; tail to 121
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
    like: 0,
    just: 5,
    perfect: 13,
    evaluation: 20,
    real: 36,
    world: 49,
    deployment: 53,
    match: 61,
    then: 77,
    thats: 83,
    path: 97,
    end: 105,
  },
});

const LAST = DURATION - 1;
/** This cut's frame f is cut 1's frame G0 + f. Every clock in the world runs on
 *  that number, so nothing in the picture restarts at the join. */
const G0 = SPEECH_END; // 97
const gAt = (f: number) => G0 + f;

// ---------------------------------------------------------------------------
// THE CAMERA — cut 1's, continued. Its knots up to the resting-drift knot are
// kept verbatim; this cut's three are hung off the end, and the whole thing is
// the same monotone Hermite through the same damper, run from the same f = 0.
// Only the Fritsch-Carlson tangent at the inherited last knot can differ, which
// is what `STATS.join` measures.
// ---------------------------------------------------------------------------
const KEEP_TO = PRE + 112; // cut 1's resting-drift knot, i.e. this cut's f15
const KNOTS2 = [
  ...CAM_KNOTS.filter((n) => n.f <= KEEP_TO),
  { f: PRE + G0 + 50, k: K_END, x: AX, y: 1250 },
  { f: PRE + G0 + 100, k: K_END, x: AX, y: 950 },
  { f: PRE + G0 + 145, k: K_END, x: AX, y: 880 },
];
const CAM = camKnots3(KNOTS2, PRE + G0 + DURATION + 60);

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCam3(PRE + gAt(f), CAM.CX, CAM.CY, CAM.K);
    const d = sway(gAt(f));
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
// THE REAL COURSE, BEYOND ITS OWN END. The course cut 1 drew runs t 0..1, and
// the model would reach the end of it inside this cut. The real world is open-
// ended — that is the whole point of the resting frame — and the curve's slalom
// stops at t 0.86, so past t 1 the course is simply its own straight
// continuation: the model rides on and the solid line behind it is the path it
// has made. `T_MAX` is where this cut leaves it.
// ---------------------------------------------------------------------------
const STRAIGHT_PER_T = SCALE_UP * H_S; // world px of course per unit t, past t 1
/** Arc length -> t on the big course, defined past its end. */
const tAtArcBig = (s: number) =>
  s <= L_B ? tAtS(TAB_B, s) : 1 + (s - L_B) / STRAIGHT_PER_T;
/** ...and back. */
const arcAtTBig = (t: number) => (t <= 1 ? TAB_B[Math.round(t * 900)] : L_B + (t - 1) * STRAIGHT_PER_T);

// ---------------------------------------------------------------------------
// THE MODEL'S RIDE. One speed track, in world px per frame, solved so it lands
// where the cut ends and nowhere else:
//   f0        9.9   cut 1's own speed at ITS f97, carried across the join
//   f0-28     ->    eased back to V_SLOW while the copy is the subject
//   f28-70    V_SLOW
//   f70-88    ->    opening up on "then that's the path"
//   f88-108   V_FAST (solved)
//   f108-120  ->    eased back to 0.8 V_FAST: slower, never stopped
// V_FAST is SOLVED (bisection) so the model is exactly at T_END on the last
// frame, and every frame is capped against the camera at 42 screen px/frame.
// ---------------------------------------------------------------------------
const HEAD_CAP = 42;
const V_JOIN = STATE_AT_SPEECH_END.markSpeed;
const V_SLOW = 6.0;
const S_START = STATE_AT_SPEECH_END.solidArc;
/** where the model has got to on the last frame, in course parameter */
const T_END = 1.12;
const F_OPEN0 = 70;
const F_OPEN1 = 88;
const F_EASE = 108;

const speedTrack = (vFast: number) => (f: number) => {
  if (f <= 28) return V_JOIN + (V_SLOW - V_JOIN) * smoothstep(clamp01(f / 28));
  if (f <= F_OPEN0) return V_SLOW;
  if (f <= F_OPEN1)
    return V_SLOW + (vFast - V_SLOW) * smoothstep(clamp01((f - F_OPEN0) / (F_OPEN1 - F_OPEN0)));
  if (f <= F_EASE) return vFast;
  return vFast * (1 - 0.2 * smoothstep(clamp01((f - F_EASE) / (LAST - F_EASE))));
};

const runRide = (vFast: number) => {
  const v = speedTrack(vFast);
  const out: number[] = new Array(DURATION + 3).fill(S_START);
  let s = S_START;
  for (let f = 1; f <= DURATION + 2; f++) {
    s += Math.min(v(f), HEAD_CAP / kAt(f));
    out[f] = s;
  }
  return out;
};

const V_FAST = (() => {
  const target = arcAtTBig(T_END);
  let lo = V_SLOW;
  let hi = 40;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (runRide(mid)[LAST] < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
const RIDE = runRide(V_FAST);
const modelAt = (f: number) => bigPt(tAtArcBig(RIDE[clampF(f)]));

// ---------------------------------------------------------------------------
// THE COPY, AND THE SIMILARITY IT RIDES.
//
// The two courses are related by ONE similarity: the small lane scaled by
// SCALE_UP about its own START point, with that start point put on the gate.
// Written out, with d(t) = smallPt(t) - (AX, LANE_START_Y):
//     big(t)  = GATE + SCALE_UP * d(t)
// so the family that carries the copy from one to the other is
//     copy(t)  = P0(lift) + s * d(t),     P0 = lerp(LANE_START, GATE, lift)
// with `lift` 0 -> 1 and s 1 -> SCALE_UP. At lift = 1 and s = SCALE_UP the copy
// IS the real course, to the last decimal — not nearly, exactly.
//
// THE ERROR IS WHAT DRIVES THE ABSORPTION, and it is worth writing down because
// the whole gesture hangs off its shape:
//     copy(t) - big(t) = (0, H_S (1 - lift)) - (SCALE_UP - s) * d(t)
// The first term is the same everywhere along the copy; the second GROWS with
// t, because d(t) does. So once the anchor is home (lift = 1) the copy is dead
// on at the gate and further out the further up it goes — which is why the
// registration unzips from the bottom, and why it unzips at all instead of
// arriving all at once. A translation that landed last would put the same error
// everywhere and the copy would vanish in one frame.
//
// THE SCALE IS DERIVED FROM THE FRONT, NOT KEYED AGAINST IT. Given where the
// seam should be, the scale that puts it there is
//     SCALE_UP - s = ABSORB / (H_S * t_front)
// so `s` is read off the front's own position every frame. That is what makes
// the copy slow down exactly as much as the seam needs — it covers 0.83 of its
// growth before the seam starts moving and the last 0.17 under it.
// ---------------------------------------------------------------------------
/** how close the copy has to be to the course to be taken into it, in world px */
const ABSORB = 2;
const F_LIFT0 = 5;
const F_LIFT1 = 34; // the anchor is home on the gate
const F_SEAT0 = 34; // ...and the settle takes over from the growth here
const F_MATCH = 62; // the coincidence lands on "match" (f61)
/** The scale the growth hands over to the settle at. Chosen, and it is the one
 *  number in the gesture that is: at 1.72 the copy's far end is still 112 world
 *  px (146 screen px) short of the course's, which is what keeps the two curves
 *  visibly out of register — a scale model laid over the real thing — while the
 *  bottom of them is already coming home. */
const S_MID = 1.72;

const liftAt = (f: number) => smoothstep(clamp01((f - F_LIFT0) / (F_LIFT1 - F_LIFT0)));

/** THE SETTLE'S DECAY RATE, SOLVED. The error at the copy's far end is
 *  H_S * (SCALE_UP - s), so the frame the copy is wholly inside ABSORB is the
 *  frame H_S * (SCALE_UP - s) = ABSORB. Letting the remaining scale decay at a
 *  constant RELATIVE rate from S_MID makes the seam climb the course by a
 *  constant FACTOR every frame (t_seam = ABSORB / (H_S (SCALE_UP - s)), so it
 *  multiplies by e^LAMBDA each frame, 1.16x here) and lands it on F_MATCH:
 *      (SCALE_UP - S_MID) e^(-LAMBDA (F_MATCH - F_SEAT0)) = ABSORB / H_S
 *  It also bounds the copy's far end, whose speed is H_S * LAMBDA * (SCALE_UP -
 *  s): fastest on the handover frame, at 16 world px/frame, and decaying from
 *  there. A geometric climb is the only schedule that does both — a seam that
 *  moved at a constant SPEED would need the scale to change hundreds of times
 *  faster than that at the bottom of the course, because down there a world px
 *  of seam is worth almost nothing in scale. */
const LAMBDA = Math.log(((SCALE_UP - S_MID) * H_S) / ABSORB) / (F_MATCH - F_SEAT0);

/** The growth: eased in over its first fifth and then flat, so it hands over to
 *  the settle still moving instead of stopping and starting again. */
const growth = (u: number) => {
  const prof = (t: number) => smoothstep(clamp01(t / 0.2));
  const N = 120;
  let acc = 0;
  let total = 0;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;
    total += prof(t);
    if (t <= clamp01(u)) acc += prof(t);
  }
  return total > 0 ? acc / total : 0;
};

const scaleAt = (f: number) => {
  if (f <= F_SEAT0) return 1 + (S_MID - 1) * growth((f - F_LIFT0) / (F_SEAT0 - F_LIFT0));
  return SCALE_UP - (SCALE_UP - S_MID) * Math.exp(-LAMBDA * (f - F_SEAT0));
};

/** The copy's point at course parameter `t` on frame `f`. */
const copyPt = (f: number, t: number) => {
  const lift = liftAt(f);
  const s = scaleAt(f);
  const p = smallPt(t);
  return {
    x: AX + s * (p.x - AX),
    y: LANE_START_Y + (GATE.y - LANE_START_Y) * lift + s * (p.y - LANE_START_Y),
  };
};

/** How far the copy is from the course it is settling onto, at `t`. */
const copyErr = (f: number, t: number) => {
  const a = copyPt(f, t);
  const b = bigPt(t);
  return Math.hypot(a.x - b.x, a.y - b.y);
};

/** The parameter the copy is absorbed up to: the largest t whose error is still
 *  inside ABSORB. The error grows with t, so this is a clean bisection and it
 *  is read off the GEOMETRY on every frame, never off a clock. */
const absorbedTo = (f: number) => {
  if (copyErr(f, 1) <= ABSORB) return 1;
  if (copyErr(f, 0) > ABSORB) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2;
    if (copyErr(f, mid) <= ABSORB) lo = mid;
    else hi = mid;
  }
  return lo;
};

/** The copy exists from the frame it leaves the lane until it is wholly taken
 *  into the course. */
const copyVisible = (f: number) => f >= F_LIFT0 && absorbedTo(f) < 1;

/** The copy's own arc length from its start to `t`, at this frame's scale: what
 *  its dash pattern is anchored to, so the dashes march along the copy instead
 *  of sliding as its drawn end retreats. */
const copyArcTo = (f: number, t: number) => scaleAt(f) * TAB_B[Math.round(clamp01(t) * 900)] / SCALE_UP;

// --- what the course itself looks like on frame f ---------------------------
/** Solid INK_HI up to here: what the model has made true, and what the seated
 *  copy has confirmed ahead of it. */
const solidTo = (f: number) => Math.max(tAtArcBig(RIDE[clampF(f)]), absorbedTo(f));

const MODEL_MASK_ID = "pm-model-hole";

// ---------------------------------------------------------------------------

const PerfectMatch: React.FC<Props> = ({
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
  const g = gAt(frame); // cut 1's frame number: every clock in the world runs on it

  // -- camera (cut 1's, continued) ------------------------------------------
  const cam = runCam3(PRE + g, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(g);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const model = modelAt(frame);
  const tSolid = solidTo(frame);
  const tCopy = absorbedTo(frame);
  const showCopy = copyVisible(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={g}
        cy={cy}
        cyRest={GRID_CY_REF}
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
            {/* the mark occludes every line it rides over, at THREAD_GAP — cut
                1's own mask, for cut 1's own reason: the blossom has counters
                through its middle, so a line run under it would be seen through
                it. */}
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
              {/* WHAT IS STILL ONLY A FORECAST: dashed, INK_LO, marching — ahead
                  of both the model and the seating front. */}
              {tSolid < 1 ? (
                <g style={{ filter: icon }}>
                  <path
                    d={pathOf(bigPt, tSolid, 1)}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE_W}
                    strokeLinecap="butt"
                    strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                    strokeDashoffset={-g * MARCH_W}
                    opacity={INK_LO}
                  />
                </g>
              ) : null}

              {/* THE PATH: solid, INK_HI. Behind the model it is what the model
                  has made true; ahead of it, it is what the seated copy has
                  confirmed — the prediction and the reality as one line. */}
              <g style={{ filter: icon }}>
                <path
                  d={pathOf(bigPt, 0, Math.max(tSolid, tAtArcBig(RIDE[clampF(frame)])))}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE_W}
                  strokeLinecap="round"
                  opacity={INK_HI}
                />
              </g>

              {/* THE LANE inside the test: solid, INK_HI, untouched. The copy
                  came off it; it did not leave with it. */}
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

              {/* THE COPY — the evaluation's version of the course, so DASHED,
                  and INK_HI because it is the subject. Drawn only from where it
                  has NOT yet been absorbed, with its dash pattern anchored to
                  its own arc length so the dashes march along it instead of
                  sliding as its end retreats up the line. */}
              {showCopy ? (
                <g style={{ filter: icon }}>
                  <path
                    d={pathOf((t) => copyPt(frame, t), tCopy, 1)}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE_W}
                    strokeLinecap="butt"
                    strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                    strokeDashoffset={-(g * MARCH_W + copyArcTo(frame, tCopy))}
                    opacity={INK_HI}
                  />
                </g>
              ) : null}
            </g>

            {/* THE TEST ENVIRONMENT, dashed since cut 1's f19 and marching on
                the same clock. */}
            <Wall
              k={k}
              cx={WALL_C.x}
              cy={WALL_C.y}
              r={R_WALL}
              draw={WALL_DRAW}
              dashedFrom={Math.PI / 2 - Math.PI * WALL_DRAW}
              dashedSweep={TWO_PI * WALL_DRAW}
              march={g}
              opacity={INK_HI}
            />
          </svg>

          {FAKE_PROPS.map((p, i) => (
            <FakePerson key={`fp${i}`} k={k} frame={g} x={p.x} y={p.y} h={FAKE_H} reveal={1} />
          ))}
          {CROWD.map((p, i) => (
            <PersonGlyph key={`pg${i}`} k={k} x={p.x} y={p.y} opacity={INK_HI} />
          ))}

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <ModelDot frame={g} k={k} x={model.x} y={model.y} tone={1} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default PerfectMatch;

export const ACCENT_USED_BY = "the model mark only";

// ---------------------------------------------------------------------------
// MEASUREMENTS.
// ---------------------------------------------------------------------------
const speedOf = (at: (f: number) => { x: number; y: number }, f: number) => {
  const a = at(f - 1);
  const b = at(f);
  const pa = screenAt(f - 1, a.x, a.y);
  const pb = screenAt(f, b.x, b.y);
  return Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
};

export const STATS = (() => {
  const j = STATE_AT_SPEECH_END;
  const mine = camAt(0);
  const join = {
    kCut1: Number(j.cam.k.toFixed(5)),
    kHere: Number(mine.k.toFixed(5)),
    kPct: Number((((mine.k - j.cam.k) / j.cam.k) * 100).toFixed(4)),
    cyCut1: Number(j.cam.cy.toFixed(3)),
    cyHere: Number(mine.cy.toFixed(3)),
    cyDiff: Number((mine.cy - j.cam.cy).toFixed(3)),
    modelCut1: [Number(j.model.x.toFixed(2)), Number(j.model.y.toFixed(2))],
    modelHere: [Number(modelAt(0).x.toFixed(2)), Number(modelAt(0).y.toFixed(2))],
    solidArcCut1: Number(j.solidArc.toFixed(2)),
    solidArcHere: Number(RIDE[0].toFixed(2)),
    vJoin: Number(V_JOIN.toFixed(3)),
    vFirstFrame: Number((RIDE[1] - RIDE[0]).toFixed(3)),
  };
  // speeds
  let maxModel = 0;
  let maxModelF = 0;
  for (let f = 1; f <= LAST; f++) {
    const v = speedOf(modelAt, f);
    if (v > maxModel) {
      maxModel = v;
      maxModelF = f;
    }
  }
  // the seating front, in screen px per frame
  let maxFront = 0;
  let maxFrontF = 0;
  for (let f = F_SEAT0 + 1; f <= F_MATCH + 2; f++) {
    const a = bigPt(absorbedTo(f - 1));
    const b = bigPt(absorbedTo(f));
    const pa = screenAt(f - 1, a.x, a.y);
    const pb = screenAt(f, b.x, b.y);
    const v = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    if (v > maxFront) {
      maxFront = v;
      maxFrontF = f;
    }
  }
  // the copy's far end, the fastest thing on it during the lift
  let maxTip = 0;
  let maxTipF = 0;
  for (let f = F_LIFT0 + 1; f <= F_MATCH; f++) {
    const a = copyPt(f - 1, 1);
    const b = copyPt(f, 1);
    const pa = screenAt(f - 1, a.x, a.y);
    const pb = screenAt(f, b.x, b.y);
    const v = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    if (v > maxTip) {
      maxTip = v;
      maxTipF = f;
    }
  }
  // the camera
  const probe = { x: AX, y: 1000 };
  let camMax = 0;
  let camMin = Infinity;
  let camDv = 0;
  let camDvF = 0;
  let prev: [number, number] = [0, 0];
  for (let f = 1; f <= LAST; f++) {
    const a = screenAt(f - 1, probe.x, probe.y);
    const b = screenAt(f, probe.x, probe.y);
    const v: [number, number] = [b[0] - a[0], b[1] - a[1]];
    const sp = Math.hypot(v[0], v[1]);
    camMax = Math.max(camMax, sp);
    camMin = Math.min(camMin, sp);
    if (f > 1) {
      const dv = Math.hypot(v[0] - prev[0], v[1] - prev[1]);
      if (dv > camDv) {
        camDv = dv;
        camDvF = f;
      }
    }
    prev = v;
  }
  // clearances: the model against the props and the people
  const PERSON_INK_HW = PERSON_H * 0.42;
  let minReal = Infinity;
  let minFake = Infinity;
  for (let f = 0; f <= LAST; f++) {
    const m = modelAt(f);
    for (const p of CROWD) {
      const dx = Math.max(0, Math.abs(m.x - p.x) - PERSON_INK_HW);
      const dy = Math.max(0, Math.abs(m.y - p.y) - PERSON_INK_HW);
      minReal = Math.min(minReal, Math.hypot(dx, dy) - MODEL_EDGE);
    }
    for (const p of FAKE_PROPS) {
      minFake = Math.min(
        minFake,
        Math.hypot(m.x - p.x, m.y - p.y) - MODEL_EDGE - (FAKE_H * 0.66 + STROKE_W / 2),
      );
    }
  }
  const lastF = LAST;
  const ringTopLast = screenAt(lastF, AX, GATE.y)[1];
  const ringBottomLast = screenAt(lastF, AX, LANE_START_Y)[1];
  const topWorldLast = camAt(lastF).cy - 960 / camAt(lastF).k;
  return {
    join,
    kConstant: [Number(camAt(0).k.toFixed(4)), Number(camAt(LAST).k.toFixed(4))],
    personScreen: Number((PERSON_H * camAt(LAST).k).toFixed(1)),
    markScreen: Number((MODEL_MARK * camAt(LAST).k).toFixed(1)),
    vFast: Number(V_FAST.toFixed(2)),
    maxModelPx: Number(maxModel.toFixed(2)),
    maxModelF,
    modelTAt: [0, 31, 62, 77, 105, LAST].map((f) => [
      f,
      Number(tAtArcBig(RIDE[f]).toFixed(3)),
      Number(screenAt(f, modelAt(f).x, modelAt(f).y)[1].toFixed(0)),
    ]),
    liftScale: [5, 10, 20, 28, 34, 40, 45, 50, 55, 58, 60, 62, 63].map((f) => [
      f,
      Number(liftAt(f).toFixed(3)),
      Number(scaleAt(f).toFixed(3)),
      Number(absorbedTo(f).toFixed(3)),
    ]),
    copyGoneAt: (() => {
      for (let f = F_SEAT0; f <= DURATION; f++) if (!copyVisible(f)) return f;
      return -1;
    })(),
    maxFrontPx: Number(maxFront.toFixed(2)),
    maxFrontF,
    maxCopyTipPx: Number(maxTip.toFixed(2)),
    maxTipF,
    camMinF: (() => {
      let mn = Infinity;
      let mf = 0;
      for (let f = 1; f <= LAST; f++) {
        const a = screenAt(f - 1, AX, 1000);
        const b = screenAt(f, AX, 1000);
        const sp = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (sp < mn) {
          mn = sp;
          mf = f;
        }
      }
      return [Number(mn.toFixed(3)), mf];
    })(),
    /** how far the copy's far end is from the course's, in screen px, per frame */
    tipGapPx: [20, 28, 34, 40, 45, 50, 55, 60].map((f) => [
      f,
      Number((copyErr(f, 1) * kAt(f)).toFixed(0)),
    ]),
    /** the copy's biggest separation from the course while it is out of the
     *  ring, in screen px */
    maxCopySepPx: (() => {
      let m = 0;
      let mf = 0;
      for (let f = F_LIFT1; f <= F_MATCH; f++) {
        let e = 0;
        for (let i = 0; i <= 20; i++) e = Math.max(e, copyErr(f, i / 20));
        const px = e * kAt(f);
        if (px > m) {
          m = px;
          mf = f;
        }
      }
      return [Number(m.toFixed(0)), mf];
    })(),
    camMaxPx: Number(camMax.toFixed(2)),
    camMinPx: Number(camMin.toFixed(3)),
    camDv: Number(camDv.toFixed(3)),
    camDvF,
    camSample: [0, 15, 31, 50, 62, 77, 96, 105, LAST].map((f) => ({
      f,
      k: Number(camAt(f).k.toFixed(3)),
      cy: Number(camAt(f).cy.toFixed(1)),
    })),
    minRealClear: Number(minReal.toFixed(1)),
    minFakeClear: Number(minFake.toFixed(1)),
    ringTopLast: Number(ringTopLast.toFixed(0)),
    ringBottomLast: Number(ringBottomLast.toFixed(0)),
    topWorldLast: Number(topWorldLast.toFixed(1)),
    markScreenYLast: Number(screenAt(lastF, modelAt(lastF).x, modelAt(lastF).y)[1].toFixed(0)),
    markSpeedLast: Number(speedOf(modelAt, lastF).toFixed(2)),
    crowdVisibleLast: CROWD.filter((p) => p.y - PERSON_H / 2 >= topWorldLast).length,
    lineTopScreenLast: Number(screenAt(lastF, bigPt(1).x, bigPt(1).y)[1].toFixed(0)),
  };
})();
