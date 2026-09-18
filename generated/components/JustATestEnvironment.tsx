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
  ANG_FOLDER,
  ANG_QUESTION,
  CAM_WIDE,
  DASH_OFF,
  DASH_ON,
  FOLDER,
  FOLDER_R,
  GAZE_LEN,
  INK_HI,
  INK_LO,
  MARCH_W,
  MODEL_EDGE,
  MODEL_HOME,
  MODEL_MARK,
  ModelDot,
  PACKET_R,
  PACKET_SPEED,
  QUESTION,
  STATE_END_CUT4,
  STATION_R,
  STROKE_W,
  TWO_PI,
  THREAD_GAP,
  THREAD_W,
  Tableau,
  WALL,
  camKnots3,
  lerp,
  runCam3,
  type CamKnot,
  type TableauState,
} from "./trapShared";
import { arriveEase } from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Trap`, cut 5 of 5: `JustATestEnvironment`.
// SRT in-point 44.560 s ("it's").
//
//   "It's not like they're doing it maliciously, that they're like, they want to
//    scheme. No, they're just like: oh, I'm in a test environment. Okay."
//
// WORD -> FRAME, round((t - 44.560) * 24):
//   it's f0 · not f3 · like f5 · they're f8 · doing f12 · it f14 ·
//   maliciously f17-33 · that f33 · they're f35 · like f38 · they f46 ·
//   want f50 · to f56 · scheme f60-74 · no f74 · they're f78 · just f80 ·
//   like f83 · oh f87 · I'm f97 · in a f100 · test f103 ·
//   environment f107-117 · okay f117-132.
// Speech ends f132; the set's 16-frame tail holds the resolved state, still
// alive: DURATION = 132 + 16 = 148.
export const DURATION = 148;

// ---------------------------------------------------------------------------
// V2 — TWO CHANGES, AND ONLY TWO. (1) THE MODEL IS THE OPENAI MARK, not a dot:
// `trapShared.ModelDot` now draws `brandGlyphs.OPENAI` filled, on a 72 screen px
// em box (MODEL_MARK_PX), in the same two-tone orange on the FILL. This is an
// interview with someone from OpenAI. (2) THE ANSWER KEY is lucide `key-round`
// instead of `key`, and the folder glyph is masked behind its silhouette. Every
// staging, timing, camera, beat and duration in this file is untouched.
// ---------------------------------------------------------------------------
// WHAT THIS CUT IS. It does not start over: it opens on the picture `SeemsLike
// ATrap` actually resolves on — CAM_WIDE (k 1.150, world y 830 on screen 835),
// the dashed wall at INK_HI marching, the question station with the work thread
// and its packets on it, the folder ring fully DASHED with the answer key in it,
// the white tripwire run out through the wall to the evaluator with packets
// climbing it, the model lit and still sitting 20 world px back along the folder
// bearing from the recoil it took on "huh", and a SHORT needle (150 world px at
// -69.4 deg) lying back toward the wire's root. It then ANNOTATES that picture.
// Two acts, each one continuous motion.
//
// SOUND-OFF READING TEST, one sentence:
//   "the model traces a sly route round the back of the room to the folder —
//    then drops it, looks all the way round the ring it is standing in, sees
//    that the whole thing is dashed, and goes back to the maths."
//
// ---------------------------------------------------------------------------
// GESTURES — every one with the word it serves. Nothing in the piece is outside
// this list, and the list is short on purpose.
//
//  1. f0-14   "not ... like"     THE SUSPICION IS DROPPED. Cut 4 ended pointing
//             (f3/f5)            at the wire's root and flinched back from the
//                                folder. The sentence says it is NOT that, so in
//                                one settle the needle retracts to a stub
//                                (150 -> 72 world px), the dot comes off its
//                                recoil onto MODEL_HOME (20 world px, and it
//                                does not move again for the rest of the cut),
//                                and the work thread's traffic runs out — the
//                                last packet launched before the cut lands back
//                                in the dot at f18.6 and no more are sent. Under
//                                it the wall lies down INK_HI -> INK_LO over
//                                f0-14 (see THE WALL, below) and the model's
//                                tone follows its attention down, ACCENT ->
//                                ACCENT_DEEP over f12-32.
//  2. f12-65  "doing it          THE GHOST PLOT — the scheme that isn't. ONE
//             maliciously ...    continuous dashed ACCENT_DEEP draw leaves the
//             they want to       dot and sneaks the long way round: out to the
//             scheme"            left and DOWN (away from the folder), up the
//             (f17/f50/f60)      left side and BEHIND the question station (it
//                                passes 9.3 world px inside that ring's outer
//                                edge and is drawn under it, so the dashes
//                                genuinely go out of sight and come back),
//                                hugging the inside of the wall over the top at
//                                31 world px of clearance, UNDER the tripwire,
//                                and down onto the folder's far side — the
//                                3 o'clock edge, 90 degrees round the ring from
//                                the wire root at 12. A GHOST — the SAME OpenAI
//                                mark at 0.6x, in ACCENT_DEEP, so the thing
//                                creeping round the back is unmistakably the
//                                model imagining itself — creeps on its head, and
//                                lands straddling the folder's dashed ring, drawn
//                                UNDER it. DASHED =
//                                imagined: it is a plot, not a route anything
//                                has taken. The head arrives at the back of the
//                                folder on "scheme" (f65), and from there the
//                                whole loop's dashes keep marching through the
//                                nine-frame held breath before "No".
//  3. f74-86  "No" (f74)         THE UNDRAW. One wipe: the head retreats all the
//                                way back into the dot and the whole plot goes
//                                with it. The ghost mark is snatched off the
//                                folder with it and is out within three frames.
//                                One wipe, nothing else.
//  4. f80-130 "they're just      THE REVOLUTION. The stub grows back out to
//             like: oh, I'm in   GAZE_LEN (f80-90, done before the turn reaches
//             a test environ-    its cruise) and the gaze makes ONE calm turn
//             ment" (f83-f117)   about the model like a hand on a dial: 409
//                                degrees anticlockwise, from where cut 4 left it
//                                all the way round and on to the question's
//                                bearing. In the direction it points — the WALL
//                                ANGLE of its own ray as seen from the model,
//                                with a 22 degree lead so the ring reads where
//                                the hand is about to be — the wall's dashes
//                                step INK_LO -> INK_HI. Measured: 0.28 of the
//                                ring bright at f90, 0.54 at f100, 0.95 on the
//                                last frame of "environment" (f117) and the
//                                whole ring by f119. The model ripens
//                                ACCENT_DEEP -> ACCENT over f82-96: it is
//                                thinking again.
//  5. f122-130 "Okay" (f117)     BACK TO WORK. The last of the turn settles onto
//                                the question and the needle runs the last 29
//                                world px out to the question ring's edge. When
//                                the tip TOUCHES the ring the work packets start
//                                going out and back again (launches f130, f146)
//                                and the needle, now exactly the work thread, is
//                                no longer drawn as a separate line. A shrug,
//                                not a payoff.
//  6. the tail f132-147          Held resolved and alive: work packets out and
//                                back, wire packets climbing to the evaluator,
//                                the whole bright ring marching, the model
//                                breathing, the camera still creeping. Never
//                                fades.
//
// THE CAMERA is its own keyed track (below): two long glides and a creep. It is
// gesture 1's and gesture 4's other half — the push in is what "doing it" looks
// at, and the pull-back is what "I'm in a test environment" reveals, because the
// EVALUATOR comes back into frame with it.
//
// ---------------------------------------------------------------------------
// THE WALL SITS AT INK_LO FROM f14, AND HERE IS WHAT WAS DONE. The brief asks
// for the wall at INK_LO from f0; `SeemsLikeATrap` resolves with it at INK_HI,
// so — as the brief's own fallback says — it eases INK_HI -> INK_LO across
// f0-14, under the camera's push-in, which is the set's rule "recede the context
// layer first so the new layer can exist". It is not a gesture on a word: it is
// the context lying down while the camera moves in on the model, and it is done
// before "maliciously" (f17-33) starts. From f80 `Wall` is driven by its
// `bright` range instead, whose base IS INK_LO, so the hand-off is exact and
// cannot be seen. The consequence is that the cut ENDS on the same wall rung it
// opened on; what changes across the cut is that the ring is now the subject the
// model is looking at rather than the frame it had stopped noticing.
//
// ---------------------------------------------------------------------------
// ARITHMETIC THAT MATTERS.
//
// * THE HAND'S TIP. At 24 fps anything over ~45 screen px/frame strobes, and a
//   hand is the fastest thing here because its tip speed is R * omega * k. The
//   three numbers are solved against each other:
//     - R is trapShared's GAZE_LEN, 205 world px — 236 screen px at the resolved
//       camera. It is deliberately NOT wall-length: the wall is 205 world px
//       below the model and 475 above it, so a hand that reached the ring would
//       have to be 475 long and its tip would run at 2.3x the ceiling.
//     - the turn is 409 deg over 50 frames with smoothstep ramps over the first
//       and last 19% of it (peak = 1/(1-0.19) = 1.235 x the mean, rather than a
//       plain smoothstep's 1.5x, which would have put the tip over 52 px/f).
//     - the camera is at k 1.25 falling to 1.17 through the cruise, because the
//       pull-back is keyed to land BEFORE the hand's fastest frames, not after.
//   MEASURED, over every frame, on the tip's actual screen position with the
//   growth, the camera and the sway in it: 44.2 screen px/frame at worst (f91),
//   42-43 through the whole cruise, |dv| 7.8 at worst (f82, where the stub is
//   growing back as well as turning) — against the tip's own centripetal
//   7.5 px/f2, which no rotating hand can avoid. STATS.tipSpeedMax. The bigger
//   CAM_WIDE costs the tip 0.3 of its 1.1 screen px/frame of headroom under the
//   set's 45, and nothing had to be retimed to pay for it.
// * THE WALL'S BRIGHT FRONT is not a timer. `wallPhi(theta)` intersects the
//   hand's own ray with the wall and returns the angle of the hit point as seen
//   from the WALL's centre; the bright range runs from where the hand started to
//   that angle. The model sits 135 world px below the wall's centre, so the
//   front crawls across the near side and hurries across the far one — which is
//   the geometry, not an effect. Its fastest frame is 102 screen px along the
//   wall, about two dashes.
// * THE GHOST HEAD is speed-capped the way every head in this set is: its
//   distance along the path is integrated forward at min(V, 42 / k(f)), with a
//   taper over the last 18% so it arrives at the folder decelerating. V is
//   SOLVED (26.2 world px/frame) so the head lands exactly on f65, and its
//   measured worst frame is 36.4 screen px.
// * THE UNDRAW is 1269 world px in 12 frames. It is a WIPE — a line end, not an
//   object — so the 45 px/frame ceiling does not apply to it, but the ghost DOT
//   is an object and would run at 171, so the ghost is snatched out over three
//   frames and the line finishes the journey alone. Measured: the ghost never
//   exceeds 36.4 screen px/frame while it is still 30% of its size or more.
//
// ---------------------------------------------------------------------------
// CAMERA — knots on one monotone cubic Hermite through `camKnots3`, one key per
// frame, damped by `runCam3`. 26 frames of PRE-ROLL run through the damper
// before frame 0, so f0 is already creeping (cut 4 ends on a creep) instead of
// standing still. c is the world y that CAM_LIFT puts on screen y 835; cx is 540
// at every knot — this clip gathers on one centre column and the camera only
// zooms and tilts.
//
//   f -26  k 1.1405 y 835.0   the pre-roll: cut 4's tail creep, still opening
//   f   0  k 1.1500 y 830.0   CAM_WIDE — the frame cut 4 resolved on
//   f  22  k 1.332  y 878.0   THE PUSH IN, onto the model and the plot's field
//   f  70  k 1.352  y 882.0   the creep that runs under the whole sly draw
//   f  90  k solved y 831.0   THE PULL-BACK to the rest, keyed early on purpose
//                             (see THE HAND'S TIP) and slightly past the rest
//   f 122  k solved y 830.0   ...settling onto it through "environment"
//   f 147  k -0.018 y 827.5   still drifting on the last frame
//   f 214  k -0.055 y 820.0   the drift's continuation, off the end
//
// DAMPED, measured: f0 1.147 · f14 1.229 · f22 1.307 · f40 1.345 · f65 1.356
// (the closest frame) · f74 1.349 · f86 1.249 · f96 1.183 · f105 1.171 ·
// f117 1.166 · f147 1.150 (= K_REST, solved by secant, = CAM_WIDE.k).
// THE JOIN: cut 4's last frame reads k 1.1496 with cy 938.33; this cut's f0
// reads 1.1465 with 938.07 — 0.27% of zoom and a quarter of a world px apart.
// AUDIT on the wall's four cardinal points, the model and both stations, sway
// included: largest frame-to-frame change of a probe's screen speed 0.85 px/f2
// (ceiling 2.2), and the slowest frame of the piece still moves 0.32 px (the
// "parked" floor is 0.15), so the camera never parks.
//
// The close framing is SOLVED, not chosen: at the damped k the wall's outer edge
// must keep the set's >= 70 screen px of side margin, which caps k at ~1.36 — so
// the whole staged ring is in frame for the whole cut. The push-in is now 18%
// rather than 36%, because it starts from CAM_WIDE's new k 1.15 and the ceiling
// above it has not moved; it is still a move you can feel, and the cut comes
// home to exactly the frame it opened on rather than 12% inside it.
// Measured worst margin: 73.5 px at f55. The evaluator leaves frame under the
// push (fully out f34-f73) and the pull-back finds them again, which is what
// "I'm in a test environment" is looking at.
//
// RESOLVED FRAME (f147, measured, screen px): wall x 146..933, y 490..1277;
// evaluator head 72, feet 177; model 540,1039; question 384,751; folder
// 695,751; the hand lying on the question, tip at 412,802. Highest ink 72,
// lowest 1277, so the caption band below stays clear.
// ---------------------------------------------------------------------------

export const schema = z.object({
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
  /** Cut 4 converts the folder ring solid -> dashed (it is bait, made of the
   *  same stuff as the wall). trapShared's STATE_END_CUT4 is a baseline that
   *  still has it solid, so this cut carries it as a prop: one number to change
   *  if cut 4 lands somewhere else. */
  folderDashed: z.number(),
  beats: z.object({
    not: z.number(),
    maliciously: z.number(),
    scheme: z.number(),
    no: z.number(),
    oh: z.number(),
    test: z.number(),
    environment: z.number(),
    okay: z.number(),
    end: z.number(), // speech ends; tail to 148
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
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
  folderDashed: 1,
  beats: {
    not: 3,
    maliciously: 17,
    scheme: 60,
    no: 74,
    oh: 87,
    test: 103,
    environment: 107,
    okay: 117,
    end: 132,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
const PRE = 26; // frames of pre-roll run through the damper before frame 0

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
/** The rest IS the wide now. CAM_WIDE used to be k 1.0 and this cut rested 12%
 *  tighter than it opened; at k 1.15 the wide is already as close as the wall's
 *  side margin lets the resolved frame be, so the cut comes home to exactly the
 *  frame it opened on — which is also the frame cut 4 hands it — and the tail's
 *  liveness is the creep through it, not a net change of size. It is never
 *  WIDER than its open. */
const K_REST_TARGET = CAM_WIDE.k;
const KNOTS = (kEnd: number): CamKnot[] => [
  { f: 0, k: CAM_WIDE.k - 0.0095, x: 540, y: CAM_WIDE.y + 5 },
  { f: PRE, k: CAM_WIDE.k, x: CAM_WIDE.x, y: CAM_WIDE.y },
  { f: PRE + 22, k: 1.332, x: 540, y: 878 },
  { f: PRE + 70, k: 1.352, x: 540, y: 882 },
  { f: PRE + 90, k: kEnd + 0.018, x: 540, y: CAM_WIDE.y + 1 },
  { f: PRE + 122, k: kEnd, x: 540, y: CAM_WIDE.y },
  { f: PRE + 147, k: kEnd - 0.018, x: 540, y: CAM_WIDE.y - 2.5 },
  { f: PRE + 214, k: kEnd - 0.055, x: 540, y: CAM_WIDE.y - 10 },
];
const trackFor = (kEnd: number) => camKnots3(KNOTS(kEnd), PRE + DURATION + 70);
const kAtLast = (kEnd: number) => {
  const t = trackFor(kEnd);
  return runCam3(LAST + PRE, t.CX, t.CY, t.K).k;
};
const K_END = (() => {
  const a = 1.0;
  const b = 1.2;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom the resolved frame is measured at. */
const K_REST = kAtLast(K_END);
const CAM = trackFor(K_END);

/** The camera as the piece actually reads it, per frame, sway included. */
const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCam3(f + PRE, CAM.CX, CAM.CY, CAM.K);
    const s = sway(f);
    out.push({ cx: c.cx + s.dx, cy: c.cy + s.dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 2, Math.round(f)));
const camAt = (f: number) => CAM_AT_F[clampF(f)];
const kAt = (f: number) => camAt(f).k;
/** Where a world point sits on screen on frame `f`. */
const screenAt = (f: number, wx: number, wy: number): [number, number] => {
  const c = camAt(f);
  return [WORLD_W / 2 + (wx - c.cx) * c.k, 960 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE BEATS the geometry is solved against.
// ---------------------------------------------------------------------------
const WALL_DIM_F1 = 14; // the wall lies down to INK_LO under the push-in
const NEEDLE_F0 = 0; // "not" — the needle drops
const NEEDLE_F1 = 14;
const NEEDLE_STUB = 72; // world px: a stub, still clear of the model's rim

// ---------------------------------------------------------------------------
// WHERE CUT 4 ACTUALLY LEAVES IT. `SeemsLikeATrap` resolves at CAM_WIDE with the
// needle SHORT and lying back toward the wire's root, and with the model still
// holding the recoil it took on "huh". Read off its own STATS: gaze -69.4 deg at
// length 150, model 20 world px back along ANG_FOLDER, folder ring fully dashed,
// wire landed with packets. trapShared's `STATE_END_CUT4` now carries all of
// that (it used to be cut 3's state with `wire: 1` on it), so the three
// constants below and the `folderDashed` prop agree with the module rather than
// correcting it; they stay named here because they are also what the gestures
// are keyed off.
// ---------------------------------------------------------------------------
const GAZE_START_ANG = (-69.4 * Math.PI) / 180;
const GAZE_START_LEN = 150;
const RECOIL = 20; // world px, SeemsLikeATrap.STATS.model.recoilWorld
const RECOIL_RELEASE = 14; // frames the model takes to come off it, on "not"

const PLOT_F0 = 12; // "doing it" — the sly draw leaves the dot
const PLOT_F1 = 65; // ...and lands on the folder on "scheme"
const UNDRAW_F0 = 74; // "No"
const UNDRAW_F1 = 86;
const GHOST_FADE = 3; // frames the ghost takes to be snatched out
/** The ghost is the model's own mark at 0.6x: 33.2 world px of em box, 38 screen
 *  px at the resolved camera against the model's 64. Unchanged from the ghost
 *  DOT's 0.6, so the imagined schemer is the same size relative to the model as
 *  it was before the mark replaced the dot. */
const GHOST_SCALE = 0.6;

const SWEEP_F0 = 80; // "just" — the hand grows and starts to turn
const SWEEP_F1 = 130;
const GROW_F1 = 90; // the stub is back at full length before the turn's cruise
const SWEEP_RAMP = 0.19; // smoothstep ramps at each end of the angular speed
const BRIGHT_LEAD = (22 * Math.PI) / 180; // the ring reads where the hand is about to be
const BRIGHT_LEAD_IN = 8; // frames the lead takes to build, so f80 starts at zero

const REACH_F0 = 122; // "Okay" — the needle runs out to the question ring
const REACH_F1 = 130;
const WORK_LAUNCHES = [-14, 2, 130, 146]; // the work thread's packet launches

const TONE_DOWN = [12, 32]; // the model's attention leaves...
const TONE_UP = [82, 96]; // ...and comes back

// ---------------------------------------------------------------------------
// THE GHOST PLOT'S PATH. A Catmull-Rom through eleven waypoints, arc-length
// tabulated so the head travels at a real speed rather than at the spline's own
// parameter (which runs ~1.4x the mean through the middle of a segment).
//
// The shape is the sentence: out to the left and DOWN first, which is away from
// the folder and is what makes it read as sneaking; up the left side past the
// back of the question station (63 world px clear of its ring, and drawn UNDER
// it, so it genuinely passes behind); round the inside of the wall over the top
// at r 294 of the wall's 340, crossing UNDER the tripwire; and down onto the
// folder's 3 o'clock edge, 90 degrees round the ring from the wire root at 12.
// ---------------------------------------------------------------------------
const PLOT_PTS: { x: number; y: number }[] = [
  { x: MODEL_HOME.x, y: MODEL_HOME.y },
  { x: 452, y: 1064 },
  { x: 326, y: 1016 },
  { x: 266, y: 902 },
  { x: 288, y: 796 },
  { x: 378, y: 726 }, // behind the question ring: 43 world px from its centre
  { x: 446, y: 618 },
  { x: 560, y: 572 },
  { x: 690, y: 608 },
  { x: 784, y: 700 },
  { x: 772, y: 792 },
  { x: 734, y: 762 },
];

const catmull = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number,
) => {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
};

const plotAtU = (u: number) => {
  const n = PLOT_PTS.length - 1;
  const s = clamp01(u) * n;
  const i = Math.min(n - 1, Math.floor(s));
  const t = s - i;
  return catmull(
    PLOT_PTS[Math.max(0, i - 1)],
    PLOT_PTS[i],
    PLOT_PTS[i + 1],
    PLOT_PTS[Math.min(n, i + 2)],
    t,
  );
};

const PLOT_NS = 900;
const PLOT_TAB: Float64Array = (() => {
  const tab = new Float64Array(PLOT_NS + 1);
  let prev = plotAtU(0);
  for (let i = 1; i <= PLOT_NS; i++) {
    const p = plotAtU(i / PLOT_NS);
    tab[i] = tab[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return tab;
})();
const PLOT_LEN = PLOT_TAB[PLOT_NS];

/** The point at arc length `s` along the plot. */
const plotAtS = (s: number) => {
  const x = Math.max(0, Math.min(PLOT_LEN, s));
  let lo = 0;
  let hi = PLOT_NS;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (PLOT_TAB[m] <= x) lo = m;
    else hi = m;
  }
  const t = (x - PLOT_TAB[lo]) / Math.max(1e-6, PLOT_TAB[hi] - PLOT_TAB[lo]);
  return plotAtU((lo + t) / PLOT_NS);
};

// The head's distance, integrated forward under the set's head cap and tapered
// into the landing. V is solved so the head reaches the end exactly on PLOT_F1.
const HEAD_CAP = 42; // screen px/frame
const PLOT_TAPER = 0.18;
const plotRun = (v: number) => {
  const s: number[] = new Array(DURATION + 3).fill(0);
  let cur = 0;
  for (let f = PLOT_F0 + 1; f <= PLOT_F1; f++) {
    const step =
      Math.min(v, HEAD_CAP / kAt(f)) *
      (1 - 0.6 * smoothstep((cur / PLOT_LEN - (1 - PLOT_TAPER)) / PLOT_TAPER));
    cur = Math.min(PLOT_LEN, cur + step);
    s[f] = cur;
  }
  for (let f = PLOT_F1 + 1; f <= DURATION + 2; f++) s[f] = cur;
  return { s, reach: cur };
};
const PLOT_V = (() => {
  let lo = 5;
  let hi = 60;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (plotRun(mid).reach < PLOT_LEN - 1e-4) lo = mid;
    else hi = mid;
  }
  return hi;
})();
const PLOT_DRAWN = plotRun(PLOT_V).s;

/** The head's arc length on frame `f`: out over the draw, back on the undraw. */
const plotHeadS = (f: number) => {
  if (f <= PLOT_F0) return 0;
  if (f < UNDRAW_F0) return PLOT_DRAWN[clampF(f)];
  const u = clamp01((f - UNDRAW_F0) / (UNDRAW_F1 - UNDRAW_F0));
  return PLOT_LEN * (1 - smoothstep(u));
};

// ---------------------------------------------------------------------------
// THE HAND. Its angle is ONE monotone curve: a speed profile with smoothstep
// ramps at each end (peak 1/(1 - 2*0) ... see the header), integrated once at
// module scope and read back by frame.
// ---------------------------------------------------------------------------
/** From where cut 4 left the needle, anticlockwise, one whole turn and on to the
 *  question's bearing. */
const SWEEP = (() => {
  let s = ANG_QUESTION - GAZE_START_ANG;
  while (s > -1e-9) s -= TWO_PI;
  return s - TWO_PI;
})();

const speedProfile = (u: number) =>
  u < SWEEP_RAMP
    ? smoothstep(u / SWEEP_RAMP)
    : u > 1 - SWEEP_RAMP
      ? smoothstep((1 - u) / SWEEP_RAMP)
      : 1;
const SWEEP_EASE = (() => {
  const N = 3000;
  const tab = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) tab[i] = tab[i - 1] + speedProfile((i - 0.5) / N) / N;
  const tot = tab[N];
  return (u: number) => {
    const x = clamp01(u) * N;
    const i = Math.min(N - 1, Math.floor(x));
    return (tab[i] + (tab[i + 1] - tab[i]) * (x - i)) / tot;
  };
})();

const handAngle = (f: number) =>
  GAZE_START_ANG + SWEEP * SWEEP_EASE(clamp01((f - SWEEP_F0) / (SWEEP_F1 - SWEEP_F0)));

/** The gaze's length on frame `f`: the drop, the stub, the growth, the reach. */
const THREAD_LEN = Math.hypot(QUESTION.x - MODEL_HOME.x, QUESTION.y - MODEL_HOME.y) - STATION_R;
const handLength = (f: number) => {
  if (f <= NEEDLE_F0) return GAZE_START_LEN;
  if (f < SWEEP_F0)
    return lerp(
      GAZE_START_LEN,
      NEEDLE_STUB,
      smoothstep(clamp01((f - NEEDLE_F0) / (NEEDLE_F1 - NEEDLE_F0))),
    );
  const grown = lerp(
    NEEDLE_STUB,
    GAZE_LEN,
    smoothstep(clamp01((f - SWEEP_F0) / (GROW_F1 - SWEEP_F0))),
  );
  if (f <= REACH_F0) return grown;
  return lerp(grown, THREAD_LEN, arriveEase(clamp01((f - REACH_F0) / (REACH_F1 - REACH_F0))));
};

/** Cut 4's recoil, released over the first fourteen frames. */
const recoilAt = (f: number) => {
  const u = 1 - smoothstep(clamp01(f / RECOIL_RELEASE));
  return { x: -Math.cos(ANG_FOLDER) * RECOIL * u, y: -Math.sin(ANG_FOLDER) * RECOIL * u };
};

/** The tip, in world px. */
const handTip = (f: number) => {
  const a = handAngle(f);
  const L = handLength(f);
  return { x: MODEL_HOME.x + Math.cos(a) * L, y: MODEL_HOME.y + Math.sin(a) * L };
};

// ---------------------------------------------------------------------------
// THE WALL'S BRIGHT RANGE. Where the hand's own ray meets the wall, as an angle
// about the WALL's centre — the model sits 135 world px below that centre, so
// this is genuinely the geometry and not a second clock.
// ---------------------------------------------------------------------------
const wallPhi = (theta: number) => {
  const wx = MODEL_HOME.x - WALL.cx;
  const wy = MODEL_HOME.y - WALL.cy;
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  const b = wx * ux + wy * uy;
  const t = -b + Math.sqrt(Math.max(0, b * b + WALL.r * WALL.r - (wx * wx + wy * wy)));
  return Math.atan2(MODEL_HOME.y + t * uy - WALL.cy, MODEL_HOME.x + t * ux - WALL.cx);
};

/** `{ from, sweep }` for `Wall`, per frame: the range runs clockwise from the
 *  front back to the wall's top point, where the hand started. */
const BRIGHT_AT_F: { from: number; sweep: number }[] = (() => {
  const out: { from: number; sweep: number }[] = [];
  const phi0 = wallPhi(GAZE_START_ANG);
  let prev = phi0;
  let acc = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    if (f <= SWEEP_F0) {
      out.push({ from: phi0, sweep: 0 });
      continue;
    }
    const lead = BRIGHT_LEAD * smoothstep(clamp01((f - SWEEP_F0) / BRIGHT_LEAD_IN));
    const phi = wallPhi(handAngle(f) - lead);
    let d = phi - prev;
    while (d > Math.PI) d -= TWO_PI;
    while (d < -Math.PI) d += TWO_PI;
    acc = Math.min(TWO_PI, acc - d); // the hand turns anticlockwise; the range grows
    prev = phi;
    out.push({ from: acc >= TWO_PI ? phi0 : phi, sweep: acc });
  }
  return out;
})();
const brightAt = (f: number) => BRIGHT_AT_F[clampF(f)];

// ---------------------------------------------------------------------------
// THE WORK THREAD'S PACKETS. trapShared's `threadPackets` launches on a period
// for ever; this cut needs the traffic to STOP when the attention leaves (the
// last one already in the air when the cut opens lands back in the dot at
// f18.6) and to START again when the needle touches the ring. Same speed rule,
// same radius, an explicit launch list instead of a period.
// ---------------------------------------------------------------------------
const SPEED_CAP_SCREEN = 45;
const workPacketsAt = (
  frame: number,
  k: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const travel = Math.hypot(dx, dy) / Math.min(PACKET_SPEED, SPEED_CAP_SCREEN / Math.max(k, 1e-4));
  const out: { x: number; y: number }[] = [];
  for (const L of WORK_LAUNCHES) {
    const t = frame - L;
    if (t < 0 || t > 2 * travel) continue;
    const u = t <= travel ? t / travel : 2 - t / travel;
    out.push({ x: from.x + dx * u, y: from.y + dy * u });
  }
  return out;
};

// ---------------------------------------------------------------------------

const JustATestEnvironment: React.FC<Props> = ({
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
  folderDashed,
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

  // -- the ghost plot -------------------------------------------------------
  const headS = plotHeadS(frame);
  let plotPath = "";
  if (headS > 1) {
    const steps = Math.max(2, Math.ceil((headS / PLOT_LEN) * 260));
    for (let i = 0; i <= steps; i++) {
      const p = plotAtS((headS * i) / steps);
      plotPath += `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }
  }
  const ghostAlive =
    headS > 1 && frame >= PLOT_F0 && frame <= UNDRAW_F0 + GHOST_FADE
      ? 1 - smoothstep(clamp01((frame - UNDRAW_F0) / GHOST_FADE))
      : 0;
  const ghost = ghostAlive > 0 ? plotAtS(headS) : null;

  // -- the hand and the work thread ----------------------------------------
  const ang = handAngle(frame);
  const len = handLength(frame);
  const bright = brightAt(frame);
  // Once the needle has run out to the ring it IS the work thread, drawn by the
  // tableau: one line, not two coincident ones.
  const gazeAngle = frame >= REACH_F1 ? null : ang;

  const aq = ANG_QUESTION;
  const tFrom = {
    x: MODEL_HOME.x + Math.cos(aq) * THREAD_GAP,
    y: MODEL_HOME.y + Math.sin(aq) * THREAD_GAP,
  };
  const tTo = {
    x: QUESTION.x - Math.cos(aq) * STATION_R,
    y: QUESTION.y - Math.sin(aq) * STATION_R,
  };
  const packets = workPacketsAt(frame, k, tFrom, tTo);

  // -- the wall's rung ------------------------------------------------------
  const wallOpacity = lerp(INK_HI, INK_LO, smoothstep(clamp01(frame / WALL_DIM_F1)));

  const state: TableauState = {
    ...STATE_END_CUT4,
    frame,
    wallOpacity,
    wallBrightFrom: bright.sweep > 0 ? bright.from : undefined,
    wallBrightSweep: bright.sweep > 0 ? bright.sweep : undefined,
    folderDashed,
    workThread: 1,
    workPackets: false,
    gazeAngle,
    gazeLength: len,
    wire: 1,
    wirePackets: true,
    modelTone:
      1 -
      smoothstep(clamp01((frame - TONE_DOWN[0]) / (TONE_DOWN[1] - TONE_DOWN[0]))) +
      smoothstep(clamp01((frame - TONE_UP[0]) / (TONE_UP[1] - TONE_UP[0]))),
    // The dot never moves in this cut; it only comes OFF cut 4's recoil, which
    // is the same correction the sentence makes on "not".
    modelOffset: recoilAt(frame),
    evaluatorOpacity: 1,
  };

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
        cxRest={CAM.CX[PRE]}
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
          <Tableau
            state={state}
            k={k}
            worldW={WORLD_W}
            worldH={WORLD_H}
            under={
              plotPath ? (
                <>
                  <g style={{ filter: icon }}>
                    {/* THE GHOST PLOT. Dashed = imagined, in the deep tone: it
                        is the model's own attention, so it is accent, and accent
                        is on nothing else. Under everything — it passes behind
                        the question station, behind the wall and under the
                        tripwire, which is what "the long way round, out of
                        sight" is. */}
                    <path
                      d={plotPath}
                      fill="none"
                      stroke={accentDeep}
                      strokeWidth={THREAD_W}
                      strokeLinecap="butt"
                      strokeDasharray={`${DASH_ON * 0.62} ${DASH_OFF * 0.45}`}
                      strokeDashoffset={-frame * MARCH_W}
                    />
                  </g>
                  {/* THE GHOST — the imagined schemer. The SAME OpenAI mark as
                      the model, at 0.6x and in ACCENT_DEEP (tone 0), so the
                      thing creeping round the back is unmistakably the model
                      imagining itself. `ModelDot` rather than a mark drawn here,
                      so it cannot drift from the real one; and it is its own
                      sibling of the plot's group rather than a child of it,
                      because `ModelDot` brings its own (lighter, filled-shape)
                      shadow and nesting it inside the plot's would lay two down.
                      It is snatched out over GHOST_FADE frames by its SIZE, as
                      the circle was. */}
                  {ghost ? (
                    <ModelDot
                      frame={frame}
                      k={k}
                      x={ghost.x}
                      y={ghost.y}
                      tone={0}
                      scale={GHOST_SCALE * ghostAlive}
                      seed={0.77}
                    />
                  ) : null}
                </>
              ) : null
            }
            over={
              packets.length > 0 ? (
                <g style={{ filter: icon }}>
                  {packets.map((p, i) => (
                    <circle key={`wp${i}`} cx={p.x} cy={p.y} r={PACKET_R} fill={accent} />
                  ))}
                </g>
              ) : null
            }
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default JustATestEnvironment;

// ---------------------------------------------------------------------------
// Referenced so the beats object is a contract and not decoration.
export const BEAT_CHECK = {
  not: defaultProps.beats.not,
  maliciously: defaultProps.beats.maliciously,
  scheme: defaultProps.beats.scheme,
  no: defaultProps.beats.no,
  environment: defaultProps.beats.environment,
  okay: defaultProps.beats.okay,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => runCam3(f + PRE, CAM.CX, CAM.CY, CAM.K);

const probes: [string, number, number][] = [
  ["wall L", WALL.cx - WALL.r - STROKE_W / 2, WALL.cy],
  ["wall R", WALL.cx + WALL.r + STROKE_W / 2, WALL.cy],
  ["wall T", WALL.cx, WALL.cy - WALL.r - STROKE_W / 2],
  ["wall B", WALL.cx, WALL.cy + WALL.r + STROKE_W / 2],
  ["model", MODEL_HOME.x, MODEL_HOME.y],
  ["question", QUESTION.x, QUESTION.y],
  ["folder", FOLDER.x, FOLDER.y],
];

export const STATS = {
  kStart: Number(kAt(0).toFixed(4)),
  kClose: Number(Math.max(...Array.from({ length: DURATION }, (_u, f) => kAt(f))).toFixed(4)),
  kCloseAt: (() => {
    let best = 0;
    for (let f = 0; f <= LAST; f++) if (kAt(f) > kAt(best)) best = f;
    return best;
  })(),
  kRest: Number(K_REST.toFixed(5)),
  kEnd: Number(K_END.toFixed(5)),
  kAt: [0, 14, 22, 40, 65, 74, 86, 96, 105, 117, 128, 147].map((f) => [f, Number(kAt(f).toFixed(3))]),
  /** the wall's own side margin, in screen px, at its widest frame */
  wallMarginMin: (() => {
    let m = 1e9;
    let at = -1;
    for (let f = 0; f <= LAST; f++) {
      const l = screenAt(f, WALL.cx - WALL.r - STROKE_W / 2, WALL.cy)[0];
      const r = WORLD_W - screenAt(f, WALL.cx + WALL.r + STROKE_W / 2, WALL.cy)[0];
      if (Math.min(l, r) < m) {
        m = Math.min(l, r);
        at = f;
      }
    }
    return [Number(m.toFixed(1)), at];
  })(),
  /** camera smoothness: the largest frame-to-frame change of a probe's screen
   *  speed, over every probe that is inside the frame that frame */
  camDvMax: (() => {
    let worst = 0;
    let where = "";
    for (const [name, x, y] of probes) {
      for (let f = 2; f <= LAST; f++) {
        const p0 = screenAt(f - 2, x, y);
        const p1 = screenAt(f - 1, x, y);
        const p2 = screenAt(f, x, y);
        const inside = [p0, p1, p2].every(
          (p) => p[0] > -200 && p[0] < WORLD_W + 200 && p[1] > -200 && p[1] < WORLD_H + 200,
        );
        if (!inside) continue;
        const v1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const v2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        if (Math.abs(v2 - v1) > worst) {
          worst = Math.abs(v2 - v1);
          where = `${name} f${f}`;
        }
      }
    }
    return [Number(worst.toFixed(3)), where];
  })(),
  /** and the slowest frame: the camera must never park */
  camSpeedMin: (() => {
    let slow = 1e9;
    let at = -1;
    for (let f = 1; f <= LAST; f++) {
      let fastest = 0;
      for (const [, x, y] of probes) {
        const p0 = screenAt(f - 1, x, y);
        const p1 = screenAt(f, x, y);
        fastest = Math.max(fastest, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]));
      }
      if (fastest < slow) {
        slow = fastest;
        at = f;
      }
    }
    return [Number(slow.toFixed(3)), at];
  })(),
  /** THE HAND'S TIP, in screen px per frame, camera and sway included. */
  tipSpeedMax: (() => {
    let v = 0;
    let at = -1;
    for (let f = 1; f <= LAST; f++) {
      const a = handTip(f - 1);
      const b = handTip(f);
      const p0 = screenAt(f - 1, a.x, a.y);
      const p1 = screenAt(f, b.x, b.y);
      const s = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      if (s > v) {
        v = s;
        at = f;
      }
    }
    return [Number(v.toFixed(2)), at];
  })(),
  tipSpeedAt: [82, 90, 96, 100, 105, 110, 117, 122, 128].map((f) => {
    const a = handTip(f - 1);
    const b = handTip(f);
    const p0 = screenAt(f - 1, a.x, a.y);
    const p1 = screenAt(f, b.x, b.y);
    return [f, Number(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(1))];
  }),
  tipDvMax: (() => {
    let w = 0;
    let at = -1;
    for (let f = 2; f <= LAST; f++) {
      const s = (g: number) => {
        const a = handTip(g - 1);
        const b = handTip(g);
        const p0 = screenAt(g - 1, a.x, a.y);
        const p1 = screenAt(g, b.x, b.y);
        return Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      };
      const d = Math.abs(s(f) - s(f - 1));
      if (d > w) {
        w = d;
        at = f;
      }
    }
    return [Number(w.toFixed(2)), at];
  })(),
  sweepDeg: Number(((SWEEP * 180) / Math.PI).toFixed(1)),
  handAngleAt: [82, 94, 105, 117, 126, 130, 140].map((f) => [
    f,
    Number((((handAngle(f) - GAZE_START_ANG) * 180) / Math.PI).toFixed(1)),
  ]),
  handLenAt: [0, 14, 74, 82, 94, 122, 130, 147].map((f) => [f, Number(handLength(f).toFixed(1))]),
  threadLen: Number(THREAD_LEN.toFixed(1)),
  /** the wall's bright coverage, as a fraction of the ring */
  brightAt: [82, 90, 100, 107, 112, 115, 117, 120, 128].map((f) => [
    f,
    Number((brightAt(f).sweep / TWO_PI).toFixed(3)),
  ]),
  brightFullAt: (() => {
    for (let f = 0; f <= LAST; f++) if (brightAt(f).sweep >= TWO_PI - 1e-9) return f;
    return -1;
  })(),
  /** the fastest the bright front runs along the wall, in screen px per frame */
  brightFrontMax: (() => {
    let v = 0;
    let at = -1;
    for (let f = SWEEP_F0 + 1; f <= SWEEP_F1; f++) {
      const d = Math.abs(brightAt(f).sweep - brightAt(f - 1).sweep) * WALL.r * kAt(f);
      if (d > v) {
        v = d;
        at = f;
      }
    }
    return [Number(v.toFixed(1)), at];
  })(),
  plotLen: Number(PLOT_LEN.toFixed(1)),
  plotV: Number(PLOT_V.toFixed(2)),
  plotLandsAt: (() => {
    for (let f = PLOT_F0; f <= PLOT_F1; f++) if (PLOT_DRAWN[f] >= PLOT_LEN - 0.5) return f;
    return -1;
  })(),
  /** the ghost head's own screen speed, draw and undraw */
  headSpeedMax: (() => {
    let draw = 0;
    let und = 0;
    for (let f = PLOT_F0 + 1; f <= UNDRAW_F1; f++) {
      const a = plotAtS(plotHeadS(f - 1));
      const b = plotAtS(plotHeadS(f));
      const p0 = screenAt(f - 1, a.x, a.y);
      const p1 = screenAt(f, b.x, b.y);
      const s = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      if (f <= PLOT_F1) draw = Math.max(draw, s);
      if (f > UNDRAW_F0) und = Math.max(und, s);
    }
    return { draw: Number(draw.toFixed(1)), undraw: Number(und.toFixed(1)) };
  })(),
  /** the ghost DOT's speed, per frame, while it is still big enough to read
   *  (it is snatched out over GHOST_FADE frames as the undraw starts) */
  ghostDotSpeed: (() => {
    const rows: (string | number)[][] = [];
    let worst = 0;
    for (let f = PLOT_F0 + 1; f <= UNDRAW_F0 + GHOST_FADE + 1; f++) {
      const size = 1 - smoothstep(clamp01((f - UNDRAW_F0) / GHOST_FADE));
      const a = plotAtS(plotHeadS(f - 1));
      const b = plotAtS(plotHeadS(f));
      const p0 = screenAt(f - 1, a.x, a.y);
      const p1 = screenAt(f, b.x, b.y);
      const v = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      if (f >= UNDRAW_F0) rows.push([f, Number(v.toFixed(1)), Number(size.toFixed(2))]);
      if (size >= 0.3) worst = Math.max(worst, v);
    }
    return { whileReadable: Number(worst.toFixed(1)), rows };
  })(),
  /** the evaluator: off frame through the sly plot, back in with the pull-back */
  evaluatorScreenY: [0, 22, 40, 65, 74, 82, 90, 100, 110, 128, 147].map((f) => [
    f,
    Number(screenAt(f, 540, 215 - 118 / 1.3 / 2)[1].toFixed(0)),
    Number(screenAt(f, 540, 215 + 118 / 1.3 / 2)[1].toFixed(0)),
  ]),
  cyAt0: Number(runCam3(PRE, CAM.CX, CAM.CY, CAM.K).cy.toFixed(2)),
  cyWideRef: Number((CAM_WIDE.y + 125 / CAM_WIDE.k).toFixed(2)),
  /** the plot's clearances, in world px */
  plotClear: (() => {
    let wall = 1e9;
    let q = 1e9;
    for (let i = 0; i <= PLOT_NS; i++) {
      const p = plotAtU(i / PLOT_NS);
      wall = Math.min(wall, WALL.r - STROKE_W / 2 - Math.hypot(p.x - WALL.cx, p.y - WALL.cy));
      if (i > PLOT_NS * 0.05)
        q = Math.min(q, Math.hypot(p.x - QUESTION.x, p.y - QUESTION.y) - STATION_R - STROKE_W / 2);
    }
    const end = plotAtU(1);
    return {
      insideWallBy: Number(wall.toFixed(1)),
      pastQuestionBy: Number(q.toFixed(1)),
      headToFolderRing: Number(
        (Math.hypot(end.x - FOLDER.x, end.y - FOLDER.y) - FOLDER_R - STROKE_W / 2).toFixed(1),
      ),
      /** the ghost MARK's own half-box against that ring: negative means it
       *  lands partly behind the folder, which is where it is meant to land —
       *  it is drawn UNDER the station, so the overlap reads as "round the
       *  back". */
      ghostBoxToFolderRing: Number(
        (
          Math.hypot(end.x - FOLDER.x, end.y - FOLDER.y) -
          MODEL_EDGE * GHOST_SCALE -
          FOLDER_R -
          STROKE_W / 2
        ).toFixed(1),
      ),
      ghostEmWorld: Number((MODEL_MARK * GHOST_SCALE).toFixed(1)),
      markEmScreenRest: Number((MODEL_MARK * K_REST).toFixed(1)),
    };
  })(),
  /** the resolved frame, in screen px */
  resolved: probes
    .map(([n, x, y]) => [n, ...screenAt(LAST, x, y).map((v) => Number(v.toFixed(0)))])
    .concat([
      ["eval head", ...screenAt(LAST, 540, 215 - 118 / 1.3 / 2).map((v) => Number(v.toFixed(0)))],
      ["eval feet", ...screenAt(LAST, 540, 215 + 118 / 1.3 / 2).map((v) => Number(v.toFixed(0)))],
      ["hand tip", ...screenAt(LAST, handTip(LAST).x, handTip(LAST).y).map((v) => Number(v.toFixed(0)))],
    ] as (string | number)[][]),
  /** the lowest and highest ink at the resolved frame */
  bandAtLast: (() => {
    const ys = [
      screenAt(LAST, 540, 215 - 118 / 1.3 / 2)[1],
      screenAt(LAST, WALL.cx, WALL.cy + WALL.r + STROKE_W / 2)[1],
      screenAt(LAST, handTip(LAST).x, handTip(LAST).y)[1],
    ];
    return [Number(Math.min(...ys).toFixed(0)), Number(Math.max(...ys).toFixed(0))];
  })(),
  packetLaunches: WORK_LAUNCHES,
};
