import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
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

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Children`, cut `GoodTrajectory`:
// "we need to get the alignment story right and on a good trajectory."
//
// DURATION. The composition starts at 1.260 s of the clip and speech ends at
// 3.880 s, so
//   DURATION = round((3.880 - 1.260) * 24) + 16 = 63 + 16 = 79
// — the spoken frames plus the set's 16-frame tail, which holds the resolved
// state without ever going still.
//
// Word onsets, frame = round((t - 1.260) * 24):
//   we 0 · need 1 · to 4 · get 7 · the 9 · ALIGNMENT 12 · story 18 ·
//   RIGHT 26 (ends 38) · and 38 · on 43 · a 45 · GOOD 46 · TRAJECTORY 49
//   (ends 63) · tail 63-79.
export const DURATION = 79;

// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "a line is being drawn up and to the right, and the scattered crowd it
//    passes through turns and starts running along it."
//
// VOCABULARY, fixed for every cut of this clip:
//   ORANGE = the AI models. Solid dots, no stroke, ACCENT_DEEP at rest and
//            ACCENT once the line has reached them; the state is TONE, never
//            alpha (makeTone). Orange is used for nothing else in this cut.
//   WHITE INK = everything we build. Here that is one thing: the trajectory
//            line and the head drawing it. They are the SPINE and they are
//            drawn OVER the flock, so they are fully opaque rather than on
//            OP_READ (see SPINE OPACITY), with iconShadow(k) on a wrapper
//            outside the camera's scale group.
//   No text, no labels, no icons, no people, no second line, no axis.
//
// ---------------------------------------------------------------------------
// GESTURES — the word each one lands on and the frames it runs over. Every
// gesture leads its word and overlaps its neighbour; nothing starts from a dead
// stop, and nothing in the piece is outside this list.
//
//  1. f0-8   "we need to get"  THE SCATTER. 340 orange COMETS in a feathered
//                              corridor along the WHOLE curve, deep-toned, each
//                              drifting along its own hashed heading at
//                              0.6-1.3 world px/frame with its tail laid
//                              opposite that heading — so a still frame reads as
//                              disorder. The seats are relaxed to a minimum
//                              separation and the headings are chosen against
//                              the opening frame, so nothing fuses into a blob
//                              (measured: no touching pair at f0). Alive from
//                              f0: the drift, the creep, the grid's parallax.
//  2. f4-49  "the alignment    THE HEAD. The white line draws on by arc length
//            story right"      behind a small solid head that is already moving
//            (f12 / f18 / f26) at 23 world px/frame when it crosses into the
//                              frame at f4, and never stops for the rest of the
//                              cut. It is the SPINE of the picture: line and
//                              head are drawn OVER the flock, at 8.0 screen px
//                              with a 5.0 px head, so the crowd gathers on to
//                              something rather than burying it. It reaches the
//                              frame's right edge at ~f35, runs just outside it
//                              through "and on a good", and the pull-back takes
//                              it back in at f49.
//  3. f4-79  (the same words)  THE ALIGNMENT, which is the mechanism, and it is
//                              a ROTATION, not a capture. A dot changes state
//                              only because of the line: it WAKES four frames
//                              before the head reaches its arc position, plus a
//                              hashed 0.5-3 frame lag (the dots nearest the line
//                              go first). Over the next 12 frames its tone goes
//                              deep -> ripe, its comet lengthens 1.5 -> 2.5
//                              diameters, and its heading turns by the SHORTEST
//                              ARC from its own drift direction on to the
//                              curve's tangent. It only starts MOVING forward
//                              when the head actually arrives, ramping to ~7
//                              world px/frame. The two sideways motions — the
//                              corridor tightening and the drift being absorbed
//                              — are rate limited against that along-curve
//                              speed, so nothing ever dives into the line:
//                              measured worst angle between a dot's real
//                              velocity and its drawn heading, once aligned,
//                              13.1 degrees. At f32, 65.6% of the dots in frame
//                              are ripe (see DEVIATIONS for why not 85).
//  4. f26-72 "and on a good"   THE GLIDE. The creep is HELD to f26 so the head
//            (f38/f43/f45/f46) gains on the frame first; then ONE pan takes the
//                              camera's content centre 590 world px ALONG the
//                              curve, into the bend and on to the arc's own box
//                              centre. It is visibly moving from ~f31 (the
//                              damper's lag), it is at full speed over
//                              "and on a good", and it never stops or reverses.
//  5. f26-72 "trajectory"      THE PULL-BACK, on the SAME long span but its own
//            (f49, ends f63)   eased curve (warp 1.5, so the zoom waits while
//                              the pan does the work and then opens): k 1.238
//                              at f26, 1.15 at f50, K_REST at f72. It resolves
//                              the whole rising arc with the stream running up
//                              it and the head still climbing, the last deep
//                              scatterers turning ahead of it, leaving the top
//                              of the frame at f72.
//  6. f63-79 tail              The camera's decaying drift carries the
//                              pull-back's own direction; the stream keeps
//                              flowing and the feed keeps entering. No fade, no
//                              static end pose.
//
// LIVENESS — mechanisms, not gestures. None is on a word and none ever stops:
//   * the drift on every un-triggered dot, and the stream on every triggered one
//   * the feed: already-aligned ripe dots entering from off-frame at the curve's
//     lower-left origin at 0.94/frame, so the stream never runs dry in frame
//   * the head, which never pauses between f0 and f79
//   * the grid's parallax and its own -0.3 px/frame drift
//   * the camera, which never parks: a creep, one long glide, and a decaying
//     drift that is still running on the last frame
// Measured motion energy (scratchpad energy.txt), mean screen px/frame over
// every dot in frame plus the head and the camera: min 4.35 (f1), mean 12.9,
// max 20.6, and the weakest 6-frame block is 5.6 — there is no stretch in which
// only one thing is moving.
//
// ---------------------------------------------------------------------------
// CAMERA — one C1-continuous track written with the shared eased-key
// construction (one key per frame off `camEase`, cy taken off the EASED k so
// zoom and framing settle together) and pushed through the shared damper. Both
// axes move, so the x track runs through the same damper with the same
// constants. The ZOOM and the PAN are keyed on their own timings: the pan is
// one glide across the whole span, and the zoom's shoulder sits inside it.
//
//   ZOOM  f0-26   k 1.220 -> 1.240  warp 0.75  the creep tightens
//         f26-72  k 1.240 -> solved warp 1.50  ONE opening: 1.238 at f26, 1.231
//                                              at f38, 1.149 at f50, K_REST
//                                              0.8244 at f72 — the pull-back is
//                                              the back half of it
//         f72-95  k       -> -0.020 warp 0.50  a drift still running at f79
//   PAN   f0-26   centre along the curve s 700 -> 764   warp 0.75  the creep
//         f26-72  centre along the curve s 764 -> 1560 while sliding off it on
//                 to the solved resting centre         warp 0.90  ONE glide
//         f72-95  +9, -11                              warp 0.50  the drift
//
// The pan is deliberately NOT split at the zoom's shoulder: `camEase` has zero
// slope at both ends of a segment, so two pan segments meeting mid-travel park
// the camera for a frame, and a stall in a pan is visible where one in a zoom
// is not.
//
// The last key of each channel is SOLVED at module scope so the DAMPED camera
// reads exactly K_REST and a content centre of (540, 960) at f72 — the resolved
// framing frame — and every weight in the piece is its screen number divided by
// K_REST.
//
// Measured on four fixed world probes (scratchpad cam.txt): max |dv| 2.445
// px/f^2 at f35 against the 2.5 budget, peak |v| 39.5 px/f inside the glide,
// and no frame after f0 under 0.4 px/f. The fastest head in the piece is 39.3
// screen px/f (the line's, at f27) and the fastest dot 10.4, both inside the
// set's 45 px/f ceiling.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * 340 DOTS, NOT 200-240. The corridor is populated along the WHOLE curve,
//     which is 2,540 world px of arc, so the brief's count is one dot per 11 px
//     — 106 of them inside the opening frame and ~135 inside the resolved one,
//     spread over a corridor 320 px wide. Rendered, that is specks on a field,
//     not a crowd: the first cut of this piece was built at 228 and the stills
//     read as dust. 340 puts ~320 in the resolved frame with no fused group
//     bigger than 3, which is the loose-but-real crowd the rest of the set uses.
//   * THE CONTRACTION IS ONE DURATION FOR THE WHOLE CORRIDOR, not one per dot.
//     Rate limiting each dot's own inward travel separately gives every dot the
//     SAME lateral speed, so a dot 160 px out overtakes one 40 px out and the
//     stream grows fused knots — measured, 7 groups of 3 to 5 touching dots on
//     the resolved frame. A shared duration makes it a uniform SCALING of the
//     corridor, lateral speed proportional to how far out a dot is, which
//     preserves the spacing the relaxation pass bought. It is sized off the
//     OUTERMOST dot, so the corridor is still closing on the last frame — one
//     more thing that has not stopped.
//   * A DOT WAKES 4 FRAMES EARLY (WAKE_LEAD), the set's own "an agent lights
//     before its thread launches". It is what keeps the band of half-turned dots
//     from swallowing the frame: at the head's 33 world px/frame a frame of lead
//     is 33 px of corridor already turning. It does not break the causal rule —
//     the dot only starts MOVING when the head actually arrives — and the sliver
//     that is mid-turn ahead of the head is 130 world px, a dot and a half.
//   * THE FEED IS BORN AT THE FRAME'S OWN LOWER-LEFT CUT, not at a fixed arc
//     position, and it runs at 0.94 dots/frame rather than one every 3-4
//     frames. Both follow from the numbers. The camera travels up the curve at
//     ~20 world px/frame during the glide while a streaming dot moves at 7, so
//     a dot born at a FIXED origin can never reach the frame again once the
//     glide has started — it would be a feed that feeds nothing. ENTRY_S(f) is
//     the arc position where the curve crosses into the frame at that frame,
//     taken from the camera table, and a feed dot is born FEED_BACK = 110 world
//     px behind it, so it is always off-frame at birth and always enters
//     visibly. The rate is the corridor's own flux: the corridor carries one
//     dot per 7.5 world px of arc and the stream runs at 7 px/frame, so
//     matching it takes 0.94/frame. At one per 3.5 frames the bottom of the
//     stream is four times too thin by the resolved frame. That rate puts
//     consecutive feed dots 7.5 world px apart along the curve — less than a
//     dot — so each emission also takes the best of ten hashed lateral offsets
//     against the last ten, or the feed grows a fused chain down the middle of
//     the stream (measured before this: a run of 14 at f72).
//   * THE DRIFT SATURATES. A straight-line drift at 0.6-1.3 px/frame is the
//     brief's, and for the first ~15 frames this IS that drift; but the dots at
//     the top of the curve are not triggered until f60-72 and by then a linear
//     drift has moved them up to 90 world px — half the corridor's half-width —
//     and the corridor ahead of the head stops reading as a corridor at all.
//     The displacement is therefore sp * T * tanh(t / T) with T = 30 frames:
//     identical to the brief near t = 0, monotone, never reversing (so the tail
//     never lies), and bounded at sp * 30.
//   * THE ARC RUNS OUT OF THE TOP OF THE RESOLVED FRAME. The brief asks for the
//     whole arc inside screen y 200-1400 AND for the head to leave the top of
//     the frame at f70-74; those are the same line and they cannot both hold.
//     The framing solve fits the arc from S_VIS_LO to S_VIS_HI — the portion
//     that is actually in frame — inside the band, and the curve continues past
//     S_VIS_HI out of the top at ~78 degrees, which is the payoff being
//     off-frame. The head leaves at f72, inside the briefed f70-74. The lower
//     end behaves as briefed: the origin leg crosses the LEFT edge at screen y
//     1345 (f72) / 1350 (f78), and there is no orange and no ink below screen y
//     1450 anywhere after f30 except that leg and the feed on it (measured, 0
//     violations at x > 150).
//   * 65.6% OF THE DOTS IN FRAME ARE RIPE AT f32, NOT 85%. The two are not the
//     same kind of number. The band of half-turned dots sits BEHIND the head and
//     travels with it, and it is (rotation + lag) frames wide: at 12 frames of
//     rotation, 4 of wake lead and up to 3 of lag, that is 11 net frames at the
//     head's 33 world px/frame = 363 px, against an opening frame that shows
//     ~940 px of curve. So even with the head standing ON the frame's right
//     edge, 39% of the frame is still turning. For 85% to be ripe the head would
//     have to be 450 world px PAST the right edge by f32, which needs 54 world
//     px/frame — 66 screen px/f, half again over the set's 45 ceiling. What CAN
//     be bought was bought: the creep now holds to f26 (the brief's f24-26) so
//     the head gains on the frame instead of the frame running with it, the lag
//     came down from 0-6 to 0.5-3 frames, and the dots wake 4 frames early;
//     together those took f32 from 42.9% to 65.6%, and the f30 still reads as
//     one ordered flow with the scatter confined to the top right corner.
//     Following the director's tie-break, the extra hold was paid for with a
//     lower k at the glide's start (1.24 rather than 1.34) rather than with a
//     later landing: |dv| 2.445 against the 2.5 budget, landing still at f72.
//   * THE DRIFT IS PRE-ROLLED BY 16 FRAMES. With the clock starting at f0 every
//     dot sits exactly on its corridor seat on the first frame with zero
//     velocity, and so with no tail: f0 renders as an ordered corridor, which is
//     the opposite of the first beat. The drift clock therefore starts at
//     -DRIFT_PRE, so f0 is already scattered and already moving.
//   * THE CURVE IS EXTRAPOLATED, not clipped, past its designed end: the head
//     is still travelling at f79, so `curveAt` runs the final tangent on. The
//     corridor is only populated to S_POP_HI.
//   * THE RESOLVED FRAME IS SOLVED ON THE CORRIDOR'S MEASURED WIDTH, not its
//     nominal one. The contraction is rate limited, so the corridor has not
//     reached D_MAX * CONTRACT by f72 — measured, its 95th percentile lateral
//     offset on that frame is 130 world px against a nominal 112 — and the band
//     has to fit what is actually there. FRAME_LAT is that measured number.
//   * THE CENTRE OF MASS IS THE BOX'S, NOT THE DOTS'. The framing solve puts the
//     corridor's bounding box centre on screen (540, 835). The DOT centroid on
//     the last frame is (437, 1011), because a convex rising arc carries most of
//     its length in its lower half; pulling that centroid up to 835 would push
//     the top third of the arc out of the frame. The picture's own box is
//     centred, which is what reads.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a model the line has reached
  accentDeep: z.string(), // deep: a model still scattered
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
    we: z.number(),
    alignment: z.number(),
    story: z.number(),
    right: z.number(),
    and: z.number(),
    good: z.number(),
    trajectory: z.number(),
    end: z.number(), // speech ends; tail to 79
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
    we: 0,
    alignment: 12,
    story: 18,
    right: 26,
    and: 38,
    good: 46,
    trajectory: 49,
    end: 63,
  },
});

const CX = FRAME_W / 2; // 540
const CY0 = 960; // the world point the resolved content centre is placed on

// ---------------------------------------------------------------------------
// THE CURVE. One smooth arc, built by integrating its own tangent angle along
// arc length, so C(s) is arc-length parametrised BY CONSTRUCTION and the lookup
// table is the integration itself rather than a resampling of a bezier.
//
//   s in [0, LEAD]              theta = THETA0                 (the origin leg)
//   s in [LEAD, LEAD+BEND]      theta ramps on a smoothstep    (the one bend)
//   s beyond that               theta = THETA1                 (the climb)
//
// The smoothstep has zero slope at both ends, so the curvature enters and
// leaves the bend at zero and the joins are C2. theta only ever increases, so
// the arc is convex with one bend and no inflection: it reads as "a good
// trajectory" the instant the whole of it is visible.
// ---------------------------------------------------------------------------
const THETA0 = (25 * Math.PI) / 180; // shallow, up and to the right
const THETA1 = (78 * Math.PI) / 180; // the climb
const LEAD = 1060;
const BEND = 1010;
const CURVE_END = 3200; // how far the table is integrated
/** The arc window the resolved frame is solved around. */
export const S_VIS_LO = 840;
export const S_VIS_HI = 2340;
/** The corridor is populated this far; the curve itself runs on past it. */
export const S_POP_HI = 2540;

const thetaAt = (s: number) =>
  THETA0 + (THETA1 - THETA0) * smoothstep((s - LEAD) / BEND);

type Pt = { x: number; y: number; tx: number; ty: number };

/** The table, one sample per world px of arc, integrated from (0, 0). It is
 *  re-centred below so the resolved picture's bbox centre sits at (540, 960). */
const CURVE: Pt[] = (() => {
  const out: Pt[] = [];
  let x = 0;
  let y = 0;
  for (let s = 0; s <= CURVE_END; s++) {
    const th = thetaAt(s);
    const tx = Math.cos(th);
    const ty = -Math.sin(th); // world y is down; the curve climbs
    out.push({ x, y, tx, ty });
    const thNext = thetaAt(s + 0.5);
    x += Math.cos(thNext);
    y += -Math.sin(thNext);
  }
  return out;
})();

/** The curve at arc position `s`, extrapolated along the end tangents outside
 *  the table so the head can keep travelling past the designed end. */
export const curveAt = (s: number): Pt => {
  if (s <= 0) {
    const a = CURVE[0];
    return { x: a.x + a.tx * s, y: a.y + a.ty * s, tx: a.tx, ty: a.ty };
  }
  if (s >= CURVE_END) {
    const a = CURVE[CURVE_END];
    const d = s - CURVE_END;
    return { x: a.x + a.tx * d, y: a.y + a.ty * d, tx: a.tx, ty: a.ty };
  }
  const i = Math.floor(s);
  const u = s - i;
  const a = CURVE[i];
  const b = CURVE[i + 1];
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    tx: a.tx + (b.tx - a.tx) * u,
    ty: a.ty + (b.ty - a.ty) * u,
  };
};

/** A corridor point: `s` along the curve, `d` across it (the left normal). */
export const corridorAt = (s: number, d: number) => {
  const p = curveAt(s);
  return { x: p.x + -p.ty * d, y: p.y + p.tx * d };
};

// ---------------------------------------------------------------------------
// THE WEIGHTS, as the clip's SCREEN numbers divided by the resting zoom, which
// is solved below. The dot is the harmony set's 14 px; the line is its 6.5 px
// outline.
// ---------------------------------------------------------------------------
const SCREEN_DOT_D = 14.0;
const SCREEN_STROKE = 8.0;

// The corridor's shape, in world px.
export const D_MAX = 160; // the lateral half-width at rest
export const CONTRACT = 0.70; // ...and what it contracts to once aligned
const N_DOTS = 340;
/** The half-width the RESOLVED frame is solved against. The contraction is rate
 *  limited (see the lateral budget below), so the corridor has not reached
 *  D_MAX * CONTRACT by f72 — it is measured at ~0.86 of D_MAX on the last
 *  frame, and that is what has to fit the band, not the nominal target. */
const FRAME_LAT = 0.80 * D_MAX;

// ---------------------------------------------------------------------------
// THE FRAMING SOLVE. The resolved picture is the arc from S_VIS_LO to S_VIS_HI
// with its ALIGNED corridor (the whole crowd is streaming by then) and a dot's
// radius around it. K_REST is the largest zoom that fits that inside the
// caption-safe band — screen x 110..970, y 200..1400 — and the curve is
// translated so the same box's centre lands on world (540, 960), which the
// camera then puts on screen (540, 835) through CAM_LIFT.
// ---------------------------------------------------------------------------
export const BAND = { x0: 110, x1: 970, y0: 200, y1: 1400 };

const FRAMING = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  // The dot radius is written against K_REST, which is what we are solving, so
  // the box is measured with a provisional one and re-measured once; two passes
  // move it by under a px.
  let kr = 0.85;
  let out = { k: kr, cx: 0, cy: 0 };
  for (let pass = 0; pass < 3; pass++) {
    minX = Infinity;
    maxX = -Infinity;
    minY = Infinity;
    maxY = -Infinity;
    const pad = SCREEN_DOT_D / 2 / kr;
    for (let s = S_VIS_LO; s <= S_VIS_HI; s += 2) {
      for (const sgn of [-1, 1]) {
        const p = corridorAt(s, sgn * (FRAME_LAT + pad));
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }
    kr = Math.min((BAND.x1 - BAND.x0) / (maxX - minX), (BAND.y1 - BAND.y0) / (maxY - minY));
    out = { k: kr, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }
  return { ...out, w: maxX - minX, h: maxY - minY };
})();

/** The translation that puts the resolved box's centre on world (540, 960). */
const OFFSET = { x: CX - FRAMING.cx, y: CY0 - FRAMING.cy };
CURVE.forEach((p) => {
  p.x += OFFSET.x;
  p.y += OFFSET.y;
});

export const K_REST = FRAMING.k;
export const DOT_R = SCREEN_DOT_D / 2 / K_REST;
export const STROKE = SCREEN_STROKE / K_REST;
/** The head: modest, 1.25x the line's half-width — 5.0 screen px at rest. */
export const HEAD_R = 1.25 * (STROKE / 2);

// ---------------------------------------------------------------------------
// SPINE OPACITY. Every other piece in the set draws its ink at OP_READ, and
// this one drew the line there too for two passes. It cannot, because of where
// the line sits in the z-order: in this cut the line is the SPINE and it is
// drawn OVER the flock, so 10% of transparency is 10% of whatever comet happens
// to be passing underneath, and the line picked up an orange cast in patches
// that moved along it frame to frame — a white line that goes faintly warm
// wherever the crowd is thickest, which reads as a rendering fault rather than
// as depth. Measured on f30 at screen (250, 960), on the line centre over a
// comet: (251, 240, 224) at OP_READ against (255, 255, 255) clear of the flock.
//
// The ink ladder is untouched everywhere it means anything — there is no second
// ink rung in this cut, the line IS all the ink — so making the spine solid
// costs the piece nothing and is the only way it stays one colour. The
// iconShadow is unchanged: the separation from the grid is the shadow's job,
// not the alpha's.
export const SPINE_OPACITY = 1.0;

// ---------------------------------------------------------------------------
// THE HEAD'S SCHEDULE. One speed track, integrated: a short ease-in over the
// first frames (it is already travelling when it enters the frame at f4), then
// near-constant, accelerating gently by 18% through the bend. It never pauses
// and it never stops.
// ---------------------------------------------------------------------------
const V_CRUISE = 33.0; // world px/frame
const V_IN = 0.55; // the fraction it starts at
const V_IN_F = 6; // ...and the frames it takes to reach cruise
const V_BEND_F0 = 38;
const V_BEND_F1 = 62;
const V_BEND_GAIN = 1.35;

const headSpeed = (f: number) =>
  V_CRUISE *
  (V_IN + (1 - V_IN) * smoothstep(f / V_IN_F)) *
  (1 + (V_BEND_GAIN - 1) * smoothstep((f - V_BEND_F0) / (V_BEND_F1 - V_BEND_F0)));

/** S_START is solved below so the head crosses into the frame at f4. */
const headTravel = (() => {
  const out = [0];
  // Long enough to outlast the NEXT cut of this clip as well: that one stands
  // in this same world at world time 110 + f, and `advanceRoom` asks for the
  // head's position at every one of those frames. The table is a prefix either
  // way, so nothing about THIS cut moves.
  for (let f = 1; f <= DURATION + 220; f++) out.push(out[f - 1] + headSpeed(f - 0.5));
  return out;
})();
const travelAt = (f: number) =>
  headTravel[Math.max(0, Math.min(headTravel.length - 1, Math.round(f)))];

// ---------------------------------------------------------------------------
// THE CAMERA. The shared eased-key construction, written for BOTH axes: one key
// per frame off `camEase`, cy taken from the EASED k (cy = c + CAM_LIFT / k) so
// the content centre does not sag while a move runs, cx taken straight. Both
// tracks then go through the shared damper with the shared constants, so the
// pan has exactly the weight of the zoom it travels with.
// ---------------------------------------------------------------------------
// The zoom and the pan are keyed on their OWN timings, because they are not the
// same gesture here: the pan is ONE long glide from the creep's end all the way
// to the resolved centre, and the zoom has a shoulder in the middle of it where
// the pull-back starts. Splitting the pan at that shoulder instead would park
// it for a frame — `camEase` has zero slope at both ends of a segment, so two
// segments meeting mid-travel is a stall, and a stall in a pan is visible where
// one in a zoom is not.
type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
type CSeg = {
  f0: number;
  f1: number;
  at: (g: number) => { x: number; y: number };
  warp: number;
};

const TRACK_F1 = DURATION + 16;

/** Segments are written CONTIGUOUS — each one starts where the last ended —
 *  because these tracks are keyed per frame and a later segment simply
 *  overwrites the frames it covers: an overlap would replace a move that had
 *  not finished with the start of the next one, which is a step in position,
 *  not a blend. The overlap the cut reads as comes from the damper, which is
 *  still catching up on one move while the next is keyed. */
const contiguous = (segs: { f0: number; f1: number }[]) => {
  segs.forEach((s, i) => {
    if (s.f1 <= s.f0) throw new Error(`camera: f${s.f0}-${s.f1} is not a forward move`);
    if (i > 0 && segs[i - 1].f1 !== s.f0) {
      throw new Error(`camera: f${segs[i - 1].f1} does not meet f${s.f0}`);
    }
  });
};

const kTrack = (segs: KSeg[]) => {
  contiguous(segs);
  const K: number[] = new Array(TRACK_F1 + 1).fill(segs[0].k0);
  for (const s of segs) {
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++) {
      K[f] = s.k0 + (s.k1 - s.k0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    }
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) K[f] = s.k1;
  }
  return K;
};

/** The pan, keyed per frame the same way, with cy taken off the EASED k of the
 *  same frame (cy = c + CAM_LIFT / k) so the content centre does not sag while
 *  a move runs. */
const cTrack = (segs: CSeg[], K: number[]) => {
  contiguous(segs);
  const CXT: number[] = new Array(TRACK_F1 + 1).fill(0);
  const CC: number[] = new Array(TRACK_F1 + 1).fill(0);
  const p0 = segs[0].at(0);
  CXT.fill(p0.x);
  CC.fill(p0.y);
  for (const s of segs) {
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++) {
      const p = s.at(camEase((f - s.f0) / (s.f1 - s.f0), s.warp));
      CXT[f] = p.x;
      CC[f] = p.y;
    }
    const e = s.at(1);
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) {
      CXT[f] = e.x;
      CC[f] = e.y;
    }
  }
  return {
    F: Array.from({ length: TRACK_F1 + 1 }, (_, f) => f),
    CX: CXT,
    CY: CC.map((c, f) => c + CAM_LIFT / K[f]),
  };
};

/** The x track through the shared damper: `runCamera` with the x channel in the
 *  centre slot. Same stiffness, same damping, same k track — so the two axes
 *  are one hand on one camera. */
const dampX = (upto: number, F: number[], CXT: number[], K: number[]) =>
  runCamera(upto, F, CXT, K).cy;

const K_OPEN = 1.22;
const K_G1 = 1.24;
const RESOLVED_F = 72; // the frame the resolved framing is solved on

/** The camera's content centre travels ALONG the curve: these are arc
 *  positions, not points. The creep runs C1_S -> C1_S_END; the long glide runs
 *  C1_S_END -> C_FIN_S while sliding off the curve onto the solved resting
 *  centre, which is the corridor's own box centre and sits ~200 world px off
 *  the arc on the inside of the bend. */
const C1_S = 700;
const C1_S_END = 764;
const C_FIN_S = 1560;
/** Where the creep hands over to the long glide. */
const F_PAN = 26;

const K_SEGS = (kEnd: number): KSeg[] => [
  { f0: 0, f1: F_PAN, k0: K_OPEN, k1: K_G1, warp: 0.75 },
  { f0: F_PAN, f1: RESOLVED_F, k0: K_G1, k1: kEnd, warp: 1.5 },
  { f0: RESOLVED_F, f1: TRACK_F1, k0: kEnd, k1: kEnd - 0.02, warp: 0.5 },
];

const C_SEGS = (fx: number, fy: number): CSeg[] => {
  const off = { x: fx - curveAt(C_FIN_S).x, y: fy - curveAt(C_FIN_S).y };
  return [
    {
      f0: 0,
      f1: F_PAN,
      warp: 0.75,
      at: (g) => {
        const p = curveAt(C1_S + (C1_S_END - C1_S) * g);
        return { x: p.x, y: p.y };
      },
    },
    {
      f0: F_PAN,
      f1: RESOLVED_F,
      warp: 0.9,
      at: (g) => {
        const p = curveAt(C1_S_END + (C_FIN_S - C1_S_END) * g);
        return { x: p.x + off.x * g, y: p.y + off.y * g };
      },
    },
    {
      f0: RESOLVED_F,
      f1: TRACK_F1,
      warp: 0.5,
      at: (g) => ({ x: fx + 9 * g, y: fy - 11 * g }),
    },
  ];
};

const trackOf = (kEnd: number, fx: number, fy: number) => {
  const K = kTrack(K_SEGS(kEnd));
  const c = cTrack(C_SEGS(fx, fy), K);
  return { F: c.F, K, CX: c.CX, CY: c.CY };
};

/** The three last keys are solved so the DAMPED camera reads exactly K_REST and
 *  a content centre of (540, 960) on the resolved frame. k does not depend on
 *  the centres, so it is solved first and exactly; each centre is then linear
 *  in its own key and a single secant is exact. */
export const K_END = (() => {
  const at = (kEnd: number) => {
    const t = trackOf(kEnd, CX, CY0);
    return runCamera(RESOLVED_F, t.F, t.CY, t.K).k;
  };
  const a = K_REST * 0.9;
  const b = K_REST * 1.05;
  return a + ((K_REST - at(a)) * (b - a)) / (at(b) - at(a));
})();

/** The pan's last key, solved so the DAMPED content centre reads exactly
 *  (540, 960) on the resolved frame. Both axes are affine in their own key, so
 *  one secant each is exact. */
const CENTRE_END = (() => {
  const cyAt = (fy: number) => {
    const t = trackOf(K_END, CX, fy);
    const c = runCamera(RESOLVED_F, t.F, t.CY, t.K);
    return c.cy - CAM_LIFT / c.k;
  };
  const a = CY0 - 200;
  const b = CY0 + 200;
  const fy = a + ((CY0 - cyAt(a)) * (b - a)) / (cyAt(b) - cyAt(a));
  const cxAt = (fx: number) => {
    const t = trackOf(K_END, fx, fy);
    return dampX(RESOLVED_F, t.F, t.CX, t.K);
  };
  const p = CX - 200;
  const q = CX + 200;
  const fx = p + ((CX - cxAt(p)) * (q - p)) / (cxAt(q) - cxAt(p));
  return { fx, fy };
})();

export const CAM = trackOf(K_END, CENTRE_END.fx, CENTRE_END.fy);

/** The camera at every frame, sway included — the table every schedule and
 *  every speed check is solved against. */
const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    const x = dampX(f, CAM.F, CAM.CX, CAM.K);
    const d = sway(f);
    out.push({ cx: x + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const camAt = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return [CX + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};
const inFrame = (f: number, wx: number, wy: number, pad = 0) => {
  const p = screenAt(f, wx, wy);
  return p[0] >= -pad && p[0] <= FRAME_W + pad && p[1] >= -pad && p[1] <= FRAME_H + pad;
};

/** The arc position where the curve crosses INTO the frame, at frame f. */
const entrySAt = (f: number) => {
  for (let s = 0; s <= S_POP_HI; s += 6) {
    if (inFrame(f, curveAt(s).x, curveAt(s).y)) return s;
  }
  return S_POP_HI;
};
const ENTRY_S: number[] = Array.from({ length: DURATION + 3 }, (_, f) => entrySAt(f));

/** S_START: the head is AT the frame's entry cut on f4, so it is off-frame
 *  before that (it travels faster than the camera's creep) and enters on it. */
export const S_START = ENTRY_S[4] - travelAt(4);
export const sHead = (f: number) => S_START + travelAt(f);

// ---------------------------------------------------------------------------
// THE CORRIDOR. A jittered grid in (s, d) with the density falling off toward
// the edge on `feather` and the nominal edge undulating on `wobble`, so the
// crowd is never a box and never a lattice. Exactly N_DOTS of them, taken by
// hashed rank weighted by the feather, so the count is a fact and the shape is
// still the feather's.
// ---------------------------------------------------------------------------
export const CELL = 2.45 * DOT_R;
const FEATHER_W = 4.5; // cells of falloff at the corridor's edge
/** No two seats closer than this many mean radii; and how hard one pass of the
 *  relaxation pushes toward that. */
export const SEP_K = 3.0;
const SEP_RELAX = 0.6;
/** Candidate drift headings tried per dot for the opening frame. */
const HD_TRIES = 12;

export type Dot = {
  s0: number;
  d0: number;
  rs: number; // radius scale
  hd: number; // drift heading
  sp: number; // drift speed, world px/frame
  vs: number; // stream speed once aligned
  trig: number; // the frame the head reaches it, plus its lag
  amp0: number; // the drift displacement frozen at the trigger
  driftF: number; // frames it then takes to be absorbed
};

export const ALIGN_F = 12; // frames a dot takes to turn, ripen and pick up the stream
/** A dot WAKES a little before the line reaches it — the set's `WAKE_LEAD`,
 *  the same reason an agent lights before its thread launches. It is what keeps
 *  the band of half-turned dots behind the head from swallowing the frame: at
 *  the head's 33 world px/frame, every frame of lead is 33 px of corridor that
 *  has already started turning. Four frames, so the sliver that is mid-turn
 *  AHEAD of the head is 130 world px — a dot and a half at the resolved zoom —
 *  and the behind/ahead contrast on a still is untouched. */
export const WAKE_LEAD = 4;
export const STREAM_V = 7.0; // world px/frame
const STREAM_SPREAD = 0.1; // +-10%, hashed: never in unison, never a fan
export const DRIFT_SAT = 30; // frames: the drift's saturation time (see DEVIATIONS)
/** The drift did not start when the cut did. Without this every dot sits
 *  exactly on its corridor seat on f0 with zero velocity and therefore no tail,
 *  and the opening frame reads as an ordered corridor — the opposite of the
 *  first beat. The clock starts DRIFT_PRE frames before f0, so f0 is already
 *  scattered and already moving. */
export const DRIFT_PRE = 16;
export const HEAD_GAP = 12; // world px: a dot never overtakes the head

// ---------------------------------------------------------------------------
// THE LATERAL BUDGET. Aligning is a ROTATION, not a capture: a dot that swings
// sideways into the line reads as being sucked in. So neither of the two
// sideways motions a dot makes after its trigger — the corridor contracting and
// its own drift being absorbed — may ever be fast enough to turn the dot's
// actual velocity away from the curve. Both are given a share of a transverse
// budget written as a fraction of the dot's ALONG-curve speed, and each one's
// DURATION is then solved from how far that particular dot has to move:
//   peak rate of a smoothstep over F frames covering X = 1.5 * X / F
//   => F = 1.5 * X / (budget * vs)
// so a dot far out in the corridor takes proportionally longer to come in and
// none of them ever cuts across. The two budgets add to 0.26, and
// atan(0.26) = 14.6 degrees, which is the worst the drawn heading can disagree
// with the real velocity once a dot is aligned. WORST_ANGLE measures it.
const LAT_BUDGET = 0.122; // the contraction's share of the along-curve speed
const DRIFT_BUDGET = 0.098; // the drift absorption's share
const CONTRACT_LAG = 6; // frames after the trigger before the corridor tightens
const CONTRACT_MIN_F = 36;
const DRIFT_MIN_F = 30;

/** The contraction is ONE duration for the whole corridor, not one per dot.
 *  Giving every dot its own budgeted span makes every dot close on the line at
 *  the SAME lateral speed, so a dot starting at 160 px out runs down a dot that
 *  started at 40 and the stream grows fused knots: measured, 7 groups of 3-5
 *  touching dots on the resolved frame. One shared duration makes the
 *  contraction a uniform SCALING of the corridor — lateral speed proportional
 *  to how far out a dot is — which preserves the spacing the relaxation pass
 *  bought, and the budget is then set by the outermost dot:
 *      F = 1.5 * (1 - CONTRACT) * D_MAX / (LAT_BUDGET * STREAM_V)
 *  Over the 79 frames of the cut the corridor therefore closes part of the way
 *  and is still closing on the last frame, which is also one more thing that
 *  has not stopped moving. */
const CONTRACT_F = Math.max(
  CONTRACT_MIN_F,
  (1.5 * (1 - CONTRACT) * D_MAX) / (LAT_BUDGET * STREAM_V),
);

/** The frame the head first reaches arc position s. */
const headReaches = (s: number) => {
  for (let f = 0; f <= DURATION + 20; f++) {
    if (sHead(f) >= s) {
      if (f === 0) return 0;
      const a = sHead(f - 1);
      const b = sHead(f);
      return f - 1 + (s - a) / Math.max(1e-6, b - a);
    }
  }
  return Infinity;
};

export const DOTS: Dot[] = (() => {
  type Cell = { s: number; d: number; f: number; i: number };
  const cells: Cell[] = [];
  const rows = Math.ceil((2 * D_MAX) / CELL) + 1;
  const cols = Math.ceil(S_POP_HI / CELL) + 1;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const i = c * rows + r;
      const s = c * CELL + (hash(i, 11) - 0.5) * CELL * 0.9;
      const d = -D_MAX + r * CELL + (hash(i, 12) - 0.5) * CELL * 0.9;
      if (s < 0 || s > S_POP_HI) continue;
      const wob = wobble(s, 2.3) * 26;
      const f = feather((D_MAX + wob - Math.abs(d)) / CELL, FEATHER_W);
      if (f <= 0) continue;
      cells.push({ s, d, f, i });
    }
  }
  // density proportional to the feather, exact count
  cells.sort((a, b) => hash(a.i, 71) / a.f - hash(b.i, 71) / b.f);
  const seats = cells.slice(0, Math.min(N_DOTS, cells.length)).map((c) => ({
    s: c.s,
    d: c.d,
    r: DOT_R * (0.8 + 0.4 * hash(c.i, 13)) * (0.75 + 0.25 * c.f),
    f: c.f,
    i: c.i,
    hd: hash(c.i, 41) * Math.PI * 2,
    sp: 0.6 + 0.7 * hash(c.i, 43),
  }));

  // -- the minimum-separation pass -----------------------------------------
  // A jittered grid puts pairs of seats on top of each other, and two dots a
  // few px apart do not read as two dots: they fuse into one blob with a
  // lumpy outline, which is what made the lower left of the resolved frame
  // look clotted. So the seats are RELAXED until no two centres are closer
  // than SEP_K times their mean radius.
  //
  // It relaxes the SEATS, not the f0 drawn positions. A dot's pre-rolled drift
  // is temporary — it is absorbed once the line reaches the dot — so a pass
  // that took it into account would be relaxing a configuration that stops
  // existing, and the dots would fall back together the moment the drift came
  // off. That was the cause of the fused knots on the resolved frame. The drift
  // is a random offset on top of a relaxed lattice, which on f0 scatters far
  // more often than it collides (measured: no fused pair on f0 at all).
  // SEP_K carries headroom for the contraction, which shrinks every lateral gap
  // by about a fifth by the last frame.
  // The push is computed in WORLD space and applied to (s, d) through the
  // local frame; the arc-length metric inside the bend differs from the flat
  // one by at most 22%, which changes how fast it converges and not where it
  // converges to, because the test is the world distance itself.
  // Deterministic: fixed pass count, fixed order, no randomness.
  seats.sort((a, b) => a.s - b.s);
  const world = (k: number) => {
    const c = curveAt(seats[k].s);
    return { x: c.x + -c.ty * seats[k].d, y: c.y + c.tx * seats[k].d, tx: c.tx, ty: c.ty };
  };
  for (let pass = 0; pass < 24; pass++) {
    let moved = 0;
    for (let i = 0; i < seats.length; i++) {
      const a = world(i);
      for (let j = i + 1; j < seats.length; j++) {
        if (seats[j].s - seats[i].s > 4 * CELL) break; // sorted by s
        const b = world(j);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const need = SEP_K * 0.5 * (seats[i].r + seats[j].r);
        if (dist >= need || dist < 1e-6) continue;
        const push = ((need - dist) / 2) * SEP_RELAX;
        const ex = dx / dist;
        const ey = dy / dist;
        for (const [k, sgn] of [
          [i, -1],
          [j, 1],
        ] as [number, number][]) {
          const w = k === i ? a : b;
          const ds = (ex * w.tx + ey * w.ty) * push * sgn;
          const dd = (ex * -w.ty + ey * w.tx) * push * sgn;
          seats[k].s = Math.max(0, Math.min(S_POP_HI, seats[k].s + ds));
          seats[k].d = Math.max(-D_MAX * 1.08, Math.min(D_MAX * 1.08, seats[k].d + dd));
        }
        moved++;
      }
    }
    if (moved === 0) break;
    seats.sort((a, b) => a.s - b.s);
  }

  // -- and the same treatment for the OPENING frame --------------------------
  // The seats are clear of each other, but on f0 every dot is displaced by its
  // pre-rolled drift, and a random offset does occasionally close a gap instead
  // of opening one. The seats cannot move — they are what the resolved frame is
  // made of — so what is chosen instead is the drift's HEADING: each dot takes
  // the best of HD_TRIES hashed directions, the one that leaves it furthest
  // from its neighbours on f0. The headings stay uniform over 360 degrees as a
  // set (they are hashed draws, only re-ordered), so nothing about the scatter
  // reads as organised.
  const amp0Of = (sp: number) => sp * DRIFT_SAT * Math.tanh(DRIFT_PRE / DRIFT_SAT);
  const at0: { x: number; y: number }[] = seats.map((c) => {
    const w = curveAt(c.s);
    return { x: w.x + -w.ty * c.d, y: w.y + w.tx * c.d };
  });
  for (let i = 0; i < seats.length; i++) {
    const base = at0[i];
    const amp = amp0Of(seats[i].sp);
    let bestHd = seats[i].hd;
    let bestGap = -1;
    for (let t = 0; t < HD_TRIES; t++) {
      const hd = hash(seats[i].i * 17 + t, 41) * Math.PI * 2;
      const px = base.x + Math.cos(hd) * amp;
      const py = base.y + Math.sin(hd) * amp;
      let gap = Infinity;
      for (let j = 0; j < seats.length; j++) {
        if (j === i) continue;
        if (Math.abs(seats[j].s - seats[i].s) > 3 * CELL) continue;
        const q = at0[j];
        gap = Math.min(gap, Math.hypot(px - q.x, py - q.y) / (0.5 * (seats[i].r + seats[j].r)));
      }
      if (gap > bestGap) {
        bestGap = gap;
        bestHd = hd;
      }
      if (gap >= SEP_K) break;
    }
    seats[i].hd = bestHd;
    at0[i] = { x: base.x + Math.cos(bestHd) * amp, y: base.y + Math.sin(bestHd) * amp };
  }

  return seats.map((c) => {
    const lag = 0.5 + 2.5 * clamp01(0.55 * (Math.abs(c.d) / D_MAX) + 0.45 * hash(c.i, 31));
    const trig = headReaches(c.s) - WAKE_LEAD + lag;
    const vs = STREAM_V * (1 + (hash(c.i, 45) - 0.5) * 2 * STREAM_SPREAD);
    const amp0 = c.sp * DRIFT_SAT * Math.tanh((trig + DRIFT_PRE) / DRIFT_SAT);
    return {
      s0: c.s,
      d0: c.d,
      rs: c.r / DOT_R,
      hd: c.hd,
      sp: c.sp,
      vs,
      trig,
      amp0,
      driftF: Math.max(DRIFT_MIN_F, (1.5 * amp0) / (DRIFT_BUDGET * vs)),
    };
  });
})();

// ---------------------------------------------------------------------------
// THE FEED. Already-aligned, ripe dots entering from off-frame at the curve's
// lower-left origin for the whole cut, so the stream never runs dry in frame.
// Born FEED_BACK behind the frame's own entry cut (see DEVIATIONS), with the
// corridor's contracted statistics.
// ---------------------------------------------------------------------------
export const FEED_RATE = 0.94; // dots/frame — the corridor's flux, see DEVIATIONS
export const FEED_BACK = 110; // world px behind the frame's entry cut
/** A feed dot is already aligned, so it arrives at the width the corridor has
 *  actually reached by then rather than at the nominal contracted target. */
export const FEED_LAT = 0.85;

export type Feed = { born: number; s0: number; d0: number; rs: number; vs: number };

/** The corridor gets a relaxation pass; the feed has to get the same treatment
 *  or it undoes it. Feed dots are born at one place, all travel at nearly one
 *  speed, and their along-curve gap is therefore fixed at STREAM_V / FEED_RATE
 *  = 7.4 world px — SMALLER than a dot — so if two consecutive ones also land
 *  near the same lateral offset they overlap for the whole cut and the stream
 *  grows a fused chain down its middle. (Measured before this: a run of 14 at
 *  f72.) So each emission takes the best of FEED_TRIES hashed candidate offsets:
 *  the one whose closest approach to the last FEED_LOOKBACK dots, evaluated in
 *  world space at its own birth frame, is largest. Deterministic, and it costs
 *  nothing at render time. */
export const FEED_TRIES = 10;
export const FEED_LOOKBACK = 10;

/** The feed, built from an ENTRY-CUT PROVIDER rather than from this cut's own
 *  table, so the sister cut can carry the same stream on past f79 against ITS
 *  camera while the frames this cut renders are untouched. The loop only ever
 *  APPENDS and each emission only looks at the last FEED_LOOKBACK before it, so
 *  a longer call is a strict superset with an identical prefix. */
export const buildFeeds = (entryS: (f: number) => number, fromF: number, toF: number, seed = 0) => {
  const out: Feed[] = [];
  const posAt = (p: Feed, f: number) => {
    const c = curveAt(p.s0 + Math.max(0, p.vs * (f - p.born)));
    return { x: c.x + -c.ty * p.d0, y: c.y + c.tx * p.d0 };
  };
  let acc = 0;
  let i = seed;
  for (let f = fromF; f <= toF; f++) {
    acc += FEED_RATE;
    while (acc >= 1) {
      acc -= 1;
      const born = f + hash(i, 52) * 0.9;
      // never born in front of the head: a feed dot is one the line has
      // ALREADY passed, and a dot ahead of the head would sit pinned against
      // the no-overtaking cap instead of streaming
      const s0 = Math.max(0, Math.min(entryS(f) - FEED_BACK, sHead(f) - HEAD_GAP - 40));
      const vs = STREAM_V * (1 + (hash(i, 55) - 0.5) * 2 * STREAM_SPREAD);
      let best: Feed | null = null;
      let bestGap = -1;
      for (let t = 0; t < FEED_TRIES; t++) {
        const u = hash(i * 31 + t, 51) * 2 - 1;
        const cand: Feed = {
          born,
          s0,
          d0: Math.sign(u) * Math.pow(Math.abs(u), 1.35) * D_MAX * FEED_LAT,
          rs: (0.8 + 0.4 * hash(i + 7919, 13)) * (0.78 + 0.22 * (1 - Math.abs(u))),
          vs,
        };
        const p = posAt(cand, born);
        let gap = Infinity;
        for (let j = Math.max(0, out.length - FEED_LOOKBACK); j < out.length; j++) {
          const q = posAt(out[j], born);
          const need = 0.5 * SEP_K * DOT_R * (cand.rs + out[j].rs);
          gap = Math.min(gap, Math.hypot(p.x - q.x, p.y - q.y) / need);
        }
        if (gap > bestGap) {
          bestGap = gap;
          best = cand;
        }
        if (gap >= 1) break; // good enough; keep the first that clears
      }
      out.push(best as Feed);
      i++;
    }
  }
  return out;
};

export const ENTRY_S_AT = (f: number) => ENTRY_S[Math.max(0, Math.min(DURATION, Math.round(f)))];
export const FEEDS: Feed[] = buildFeeds(ENTRY_S_AT, 0, DURATION);

// ---------------------------------------------------------------------------
// THE MOTION. One function, used for the drawn frame AND for the finite
// difference that gives every tail its direction, so a tail can never lie.
// ---------------------------------------------------------------------------

/** Arc length covered since the trigger: the stream speed ramps in over
 *  ALIGN_F frames on a smoothstep, integrated in closed form. */
export const streamAdvance = (t: number, v: number) => {
  if (t <= 0) return 0;
  if (t >= ALIGN_F) return v * (ALIGN_F / 2 + (t - ALIGN_F));
  const u = t / ALIGN_F;
  return v * ALIGN_F * (u * u * u - (u * u * u * u) / 2);
};

/** The head is never overtaken: a dot's ADVANCE along the curve is capped at the
 *  room between where it started and the head's own position less HEAD_GAP. It
 *  is written on the advance rather than on the position so that a dot which has
 *  not been reached yet — and which is therefore AHEAD of the head, most of the
 *  corridor for most of the cut — is left exactly where it is. Both terms are
 *  zero at the trigger, so there is no step there; and the cap never actually
 *  binds (a stream dot runs at ~7 world px/frame against the head's 23-44), which
 *  CLAMP_BINDS proves by counting. */
export const advanceRoom = (s0: number, f: number) => Math.max(0, sHead(f) - HEAD_GAP - s0);

/** `hd` is the DRAWN heading — the direction the comet points along. Before the
 *  trigger it is the drift's own heading exactly; after it, it is the shortest
 *  arc from that heading on to the curve's tangent, eased over the same ALIGN_F
 *  the tone is. Aligning is therefore a rotation the dot performs, not a
 *  direction read off a velocity that is still being dragged sideways. */
export type Live = {
  x: number;
  y: number;
  r: number;
  tone: number;
  hd: number;
  /** The dot's own arc position on the curve. Nothing in THIS cut reads it —
   *  the sister cut does, to decide which comets have passed its threshold. */
  s: number;
};

/** The shortest signed arc from a to b. */
export const arcTo = (a: number, b: number) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

export const dotAt = (d: Dot, f: number): Live => {
  const t = f - d.trig;
  const a = smoothstep(clamp01(t / ALIGN_F));
  // the WAKE is the turn and the colour; the dot only starts MOVING forward
  // when the line actually gets to it, WAKE_LEAD frames later, so the causal
  // rule is intact and the no-overtaking cap never has to bind
  const s = d.s0 + Math.min(streamAdvance(t - WAKE_LEAD, d.vs), advanceRoom(d.s0, f));
  // the corridor tightens on its own clock: it starts CONTRACT_LAG after the
  // trigger and takes as long as this dot's own offset needs at the lateral
  // budget, so a dot far out comes in slowly instead of cutting across
  const latU = smoothstep(clamp01((t - CONTRACT_LAG) / CONTRACT_F));
  const lat = d.d0 * (1 - (1 - CONTRACT) * latU);
  const c = curveAt(s);
  const px = c.x + -c.ty * lat;
  const py = c.y + c.tx * lat;
  // the private drift: frozen at the trigger, then let go over its own budgeted
  // span for the same reason
  const tt = Math.max(0, Math.min(f, d.trig) + DRIFT_PRE);
  const grow = d.sp * DRIFT_SAT * Math.tanh(tt / DRIFT_SAT);
  const amp = grow * (1 - smoothstep(clamp01(t / d.driftF)));
  return {
    x: px + Math.cos(d.hd) * amp,
    y: py + Math.sin(d.hd) * amp,
    r: DOT_R * d.rs,
    tone: a,
    hd: d.hd + arcTo(d.hd, Math.atan2(c.ty, c.tx)) * a,
    s,
  };
};

export const feedAt = (p: Feed, f: number): Live => {
  const s = p.s0 + Math.min(Math.max(0, p.vs * (f - p.born)), advanceRoom(p.s0, f));
  const c = curveAt(s);
  return {
    x: c.x + -c.ty * p.d0,
    y: c.y + c.tx * p.d0,
    r: DOT_R * p.rs,
    tone: 1,
    hd: Math.atan2(c.ty, c.tx),
    s,
  };
};

export type Drawn = Live & { key: string; vx: number; vy: number };

export const buildWorld = (frame: number): Drawn[] => {
  const out: Drawn[] = [];
  DOTS.forEach((d, i) => {
    const now = dotAt(d, frame);
    const was = dotAt(d, frame - 1);
    out.push({ ...now, key: `d${i}`, vx: now.x - was.x, vy: now.y - was.y });
  });
  FEEDS.forEach((p, i) => {
    if (frame < p.born) return;
    const now = feedAt(p, frame);
    const was = feedAt(p, frame - 1);
    // the first frame is a scale-in of 2 frames, so nothing ever pops
    const grow = Math.min(1, (frame - p.born) / 2);
    out.push({
      ...now,
      r: now.r * grow,
      key: `e${i}`,
      vx: now.x - was.x,
      vy: now.y - was.y,
    });
  });
  return out;
};

// ---------------------------------------------------------------------------
// THE COMET. A dot and its tail are ONE path, not a triangle stuck on to a
// circle: the two sides of the tail are the TANGENT LINES from the tip back to
// the dot, so the outline has no shoulder where the two meet and the shape
// reads as one body with a wake rather than as a map pin.
//
//   tip T at distance L from the centre, opposite the drawn heading
//   the tangent point is at angle phi = acos(r / L) off the centre->tip axis
//   outline: P1 -> the MAJOR arc round the front of the dot -> P2 -> T -> close
//
// L is driven by the dot's STATE, on the same eased ramp as the tone: 1.5 x the
// diameter while it is drifting, 2.5 x once it is streaming. Nothing here reads
// the velocity, so there are no length spikes and no flicker when a dot's
// frame-to-frame speed happens to dip.
// ---------------------------------------------------------------------------
export const TIP_DRIFT = 1.5; // x diameter, a dot still wandering
export const TIP_STREAM = 2.5; // x diameter, a dot in the stream

export const cometPath = (d: Drawn) => {
  const r = d.r;
  if (r < 0.05) return null;
  const L = 2 * r * (TIP_DRIFT + (TIP_STREAM - TIP_DRIFT) * d.tone);
  if (L <= r * 1.05) return null;
  // the tip lies behind the dot, i.e. opposite the heading
  const ux = -Math.cos(d.hd);
  const uy = -Math.sin(d.hd);
  const nx = -uy;
  const ny = ux;
  const cp = r / L; // cos phi
  const sp = Math.sqrt(1 - cp * cp);
  const n = (v: number) => v.toFixed(2);
  const p1x = d.x + r * (cp * ux + sp * nx);
  const p1y = d.y + r * (cp * uy + sp * ny);
  const p2x = d.x + r * (cp * ux - sp * nx);
  const p2y = d.y + r * (cp * uy - sp * ny);
  // P1 -> P2 the long way round, which is the front of the dot
  return (
    `M${n(p1x)} ${n(p1y)} A${n(r)} ${n(r)} 0 1 1 ${n(p2x)} ${n(p2y)} ` +
    `L${n(d.x + ux * L)} ${n(d.y + uy * L)} Z`
  );
};

/** The spine, sampled from the curve table between two arc positions, with the
 *  point its head sits on. Shared with the sister cut, which draws a scaled
 *  copy of the same curve. */
export const spinePath = (
  s0: number,
  s1: number,
  at: (s: number) => { x: number; y: number } = curveAt,
  step = 6,
) => {
  let d = "";
  for (let s = s0; s <= s1; s += step) {
    const p = at(s);
    d += `${s === s0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  const e = at(s1);
  d += `L${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  return { d, head: e };
};

// ---------------------------------------------------------------------------

const GoodTrajectory: React.FC<Props> = ({
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
}) => {
  const frame = useCurrentFrame();

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const camX = dampX(frame, CAM.F, CAM.CX, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const world = buildWorld(frame);
  const toRipe = makeTone(accentDeep, accent);

  // -- the line: drawn on by arc length behind the head -----------------------
  const sh = sHead(frame);
  const line = spinePath(0, sh);

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
        cxRest={CAM.CX[0]}
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
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the models: one comet each, solid, in the dot's own tone. They
                go UNDER the line, because the line is the spine of the picture
                and the flock is what is gathering on to it. */}
            {world.map((d) => {
              const p = cometPath(d);
              return p ? (
                <path key={d.key} d={p} fill={toRipe(d.tone)} opacity={dotOpacity} />
              ) : null;
            })}

            {/* the trajectory, drawn on behind its head, over the flock.
                FULLY OPAQUE — see SPINE OPACITY in the header. */}
            <g style={{ filter: icon }}>
              <path
                d={line.d}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={SPINE_OPACITY}
              />
              <circle
                cx={line.head.x}
                cy={line.head.y}
                r={HEAD_R}
                fill={ink}
                opacity={SPINE_OPACITY}
              />
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default GoodTrajectory;

// ---------------------------------------------------------------------------
// The numbers this cut is built on, exported so they are measured rather than
// asserted.
// ---------------------------------------------------------------------------
export const CAM_AT = (f: number) => ({
  ...runCamera(f, CAM.F, CAM.CY, CAM.K),
  cx: dampX(f, CAM.F, CAM.CX, CAM.K),
});
export const CURVE_AT = curveAt;
export const CORRIDOR_AT = corridorAt;
export const SCREEN_AT = screenAt;
export const BEATS = defaultProps.beats;
export const STATS = {
  duration: DURATION,
  curve: {
    theta0: 25,
    theta1: 78,
    lead: LEAD,
    bend: BEND,
    visLo: S_VIS_LO,
    visHi: S_VIS_HI,
    popHi: S_POP_HI,
    boxW: Number(FRAMING.w.toFixed(1)),
    boxH: Number(FRAMING.h.toFixed(1)),
    offset: { x: Number(OFFSET.x.toFixed(1)), y: Number(OFFSET.y.toFixed(1)) },
  },
  kOpen: Number(CAM.K[0].toFixed(4)),
  kTrack: [0, 12, 18, 25, 38, 50, 63, 72, 78].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
  kRest: Number(K_REST.toFixed(4)),
  kEnd: Number(K_END.toFixed(4)),
  kAtResolved: Number(runCamera(RESOLVED_F, CAM.F, CAM.CY, CAM.K).k.toFixed(4)),
  centreAtResolved: (() => {
    const c = runCamera(RESOLVED_F, CAM.F, CAM.CY, CAM.K);
    return [
      Number(dampX(RESOLVED_F, CAM.F, CAM.CX, CAM.K).toFixed(1)),
      Number((c.cy - CAM_LIFT / c.k).toFixed(1)),
    ];
  })(),
  camStiff: CAM_STIFF,
  dotR: Number(DOT_R.toFixed(2)),
  dotScreenRest: Number((2 * DOT_R * K_REST).toFixed(1)),
  dotScreenOpen: Number((2 * DOT_R * CAM.K[0]).toFixed(1)),
  strokeWorld: Number(STROKE.toFixed(2)),
  strokeScreenRest: Number((STROKE * K_REST).toFixed(2)),
  headR: Number(HEAD_R.toFixed(2)),
  dots: DOTS.length,
  feeds: FEEDS.length,
  sStart: Number(S_START.toFixed(1)),
  sHeadAt: [0, 4, 12, 26, 40, 46, 49, 63, 72, 78].map((f) => [f, Number(sHead(f).toFixed(0))]),
  headSpeedAt: [0, 4, 12, 26, 46, 63, 78].map((f) => [f, Number(headSpeed(f).toFixed(1))]),
  entryS: ENTRY_S.filter((_, f) => f % 8 === 0),
  /** How often the no-overtaking cap actually binds. It is a safety net, not a
   *  mechanism: if this is not 0 the stream is running into the head. */
  clampBinds: (() => {
    let n = 0;
    for (let f = 0; f < DURATION; f++) {
      for (const d of DOTS) {
        if (streamAdvance(f - d.trig - WAKE_LEAD, d.vs) > advanceRoom(d.s0, f) + 1e-9) n++;
      }
      for (const p of FEEDS) {
        if (f >= p.born && p.vs * (f - p.born) > advanceRoom(p.s0, f) + 1e-9) n++;
      }
    }
    return n;
  })(),
};
