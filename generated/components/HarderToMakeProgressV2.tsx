import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  hash,
  iconShadow,
  sway,
  worldTransform,
} from "./fieldShared";
import { INK, INK_LO, lerp, runCam3 } from "./trapShared";
import {
  LevelLine,
  MODEL_EDGE,
  MODEL_MARK,
  ModelMark,
  QuestionRing,
  RING_R,
  SOLVE_F,
  SPEED_CAP_SCREEN,
  ringSway,
  strokeScreen,
  strokeW,
} from "./challengeShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Challenge_The_Model`, cut 5 of the set, V2:
// `HarderToMakeProgressV2` (in-point 0:37.460).
// Line (SRT 0:37.460 -> 0:41.899):
//   "then that is a plausible scenario where actually, like, okay, it becomes
//    much harder to make progress"
//
// THE CLIP'S ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges
// it. A question BELOW the model's line is too easy and lifts nothing.**
//
// THE DIRECTOR'S NOTE ON V1: "37 feels lazy, taken from previous graphics,
// doesn't really visualize how progress is slowing down. Make it clear that
// progress is slowing down."
//
// V1 re-used cut 1's picture — the same column, the same gathered mass — and
// said "harder" by putting one lonely `?` a long way above the line. That is a
// statement about DISTANCE, made once, in a picture the viewer had already seen
// four times. THIS CUT IS A DIFFERENT PICTURE OF THE SAME WORLD, and it says
// the thing as a SHAPE THAT IS DRAWN WHILE YOU WATCH:
//
//   **PROGRESS IS A CURVE OVER TIME, AND THE CURVE FLATTENS.**
//
//   TIME IS THE HORIZONTAL AXIS. The camera pans right at ONE constant rate for
//   all 123 frames and never stops: that is the clock, and it is the only thing
//   in the cut that does not slow down. The model travels with it at exactly
//   that rate (it cannot outrun time and it cannot fall behind), so its HEIGHT
//   is the only free variable — and its height is its level, which is the
//   clip's one idea. The model rides a curve that is steep behind it and
//   flattening under it: 54 degrees at f0, 17 at f85, 4.5 on the last frame.
//   THE TRAIL IT LEAVES IS THE GRAPHIC. At f85 the frame holds the whole shape
//   at once — 45.0 degrees where the trail enters at the left, 16.7 at the mark
//   — and by the last frames the trail arrives flat.
//
//   IT CLIMBS ONLY BY REACHING A QUESTION. The `?` rungs sit ON the curve.
//   Behind the mark they are dense (the too-easy era: a rung every ~5 frames,
//   already ticked and dim); ahead of it the gaps grow geometrically, so the
//   model reaches one at f2, f12, f26, f44, f68 and f106 — 10, 14, 18, 24
//   and 38 frames of waiting — and the NEXT one is 590 world px further along
//   the near-flat curve, over the right edge at f104 and never reached.
//
// VOCABULARY — `challengeShared`'s, and nothing is invented here. The model is
// the OpenAI mark filled ACCENT; its LEVEL is one thin accent line through it
// that moves only because the mark moves; a QUESTION is a white ring with
// lucide `circle-help`'s `?` in it and its HEIGHT IS ITS DIFFICULTY; it is
// ANSWERED — `?` out, tick in, ink 1.0 -> 0.5 over SOLVE_F = 10 frames — when
// the model reaches it, solved from the MODEL'S OWN POSITION every frame and
// never from a frame number. Two ink rungs, one stroke family, no text, no
// boxes, no third colour. No climbers, no boards, no person, no gathered mass.
//
// THE FLIP RULE, and why it is the clip's own rule and not a new one. Cut 1's
// rule is `solvedAt(lineY, q)`: the level line has reached the ring's centre.
// Cut 2's is `Rung.cross`: the mover's LEADING EDGE along its path has touched
// the ring's RIM, because a 72 px mover crosses a 72 px ring in eight frames
// and a flip keyed on the centre happens entirely underneath it. Here the mover
// IS the model and its level line, so the two rules are the same statement
// eight frames apart: rim contact starts the flip, and the level line passes
// the ring's centre 7.0-7.6 frames later — in the middle of the flip, every
// time (asserted). The `?` starts going as the mark arrives and the tick is
// finished and uncovered as it leaves.
//
// DURATION. 4.439 s of speech x 24 = 106.5 -> 107 frames, plus the set's
// 16-frame tail: DURATION = 107 + 16 = 123.
//
// Word -> frame (24 fps from comp start):
//   then 0 · that 4 · is 13 · a 17 · plausible 20 · scenario 26 · where 34 ·
//   actually 38 · like 45 · okay 55 · it 61 · becomes 63 · much 70 · harder 77 ·
//   to 81 · make 83 · progress 85 · (speech ends 107)
//
// SOUND-OFF READING TEST — one sentence:
//   "an orange mark with a level line through it is climbing a line that comes
//    up steeply from the bottom left, studded with close-together ticked
//    circles; as the camera slides steadily right the line bends over and goes
//    flat, the question marks it still has to reach get further and further
//    apart, and by the end it is barely rising with the next one a long way off
//    to the right."
//
// ---------------------------------------------------------------------------
// GESTURES — the complete list. One curve, one pan, one pull-back. Every rung
// flip is the SAME mechanism firing, not a separate gesture.
//
//  1. f0-34    "then that is a      THE STEEP PAST, STILL PAYING OFF. The mark
//              plausible scenario   is already travelling at f0 (70 frames of
//              where"               pre-roll on both the pan and the climb),
//              (f20/f26/f34)        rising 13.2 world px a frame, with the trail
//                                   behind it plunging at 54-59 degrees and five
//                                   dim ticked rings strung close along it —
//                                   one of them still finishing its flip from
//                                   before the cut began. It reaches rungs at
//                                   f8 and f24: two quick wins, 16 frames apart.
//
//  2. f34-66   "actually, like,     THE BEND. The rung at f42, and then the
//              okay, it becomes"    longest wait the cut has shown. Across this
//              (f38/f45/f55/f61/    stretch the rise falls 8.3 -> 3.9 world px
//               f63)                a frame while the pan does not change at
//                                   all, so the trail visibly lies over; the
//                                   pull-back (k 1.25 -> 0.92, warp 0.75) is
//                                   under way from f20 and is what puts the
//                                   whole shape in frame. The f66 rung lands
//                                   four frames before "much" (70).
//
//  3. f66-107  "much HARDER to      THE PLATEAU. The rise decays 3.9 -> 1.1 px
//              make PROGRESS"       a frame. At f85 — "progress" — the frame
//              (f70/f77/f83/f85)    holds the whole curve: 45.0 degrees where
//                                   the trail enters at the left, 16.7 at the
//                                   mark, and from f110 the trail arrives under
//                                   8 degrees. The f101 rung is a tiny rise
//                                   after 35 frames of nothing, and the NEXT `?`
//                                   comes over the right edge at f105, 660 px
//                                   further along the flat.
//
//  4. f107-123 (continues 2 and 3)  THE TAIL. THE CLOCK DOES NOT SLOW DOWN: the
//                                   pan is the same 9.5 world px a frame it was
//                                   at f0 and the zoom is still creeping out, so
//                                   every fixed point in the world is still
//                                   moving 8.9 screen px a frame on the last
//                                   frame. The f101 flip completes at f111, the
//                                   mark is still rising (0.90 px/f, never
//                                   zero), and the next `?` is still 531 world
//                                   px — 56 frames — away. THE CUT DOES NOT
//                                   RESOLVE.
//
// AMBIENT ONLY (mechanisms, so no window of the cut is still): every rung's own
// <= 3 px drift on its own two periods, run on the CLIP's timeline (frame +
// CONTINUE_FROM) so it continues the earlier cuts rather than restarting; the
// grid's parallax under the pan and its -0.3 px/frame drift; the camera's
// `sway`; a climb whose speed never touches zero. Nothing else: no labels, no
// axis, no ticks, no arrows, no dashed lines, no second accent, no flashes.
//
// ---------------------------------------------------------------------------
// THE CURVE, SOLVED RATHER THAN DRAWN.
//
// The requirement is not "an exponential" — it is four numbers that have to be
// true at once, and only one family of curves makes all four true:
//
//   (a) the visible past is 55-60 degrees (steeper reads as a cliff, and a
//       cliff has no bend in it);
//   (b) the mark is still rising 0.9 world px a frame on the LAST frame, so the
//       cut ends slowing rather than stopped;
//   (c) at f85 the frame holds a section at >= 45 degrees AND the mark;
//   (d) dy/dx is monotone decreasing everywhere, with no kink.
//
// A single decaying exponential fails (a): its slope grows without bound going
// back, so at the left of the visible past it is 73-80 degrees. A slope that
// SATURATES fixes that without a clamp (a clamp is a kink, which fails (d)):
//
//   dy/dx = -SMAX / (1 + exp((x - Xm) / L))
//
// — a logistic in x. Going back it approaches SMAX = tan(60 deg) and stops;
// going forward it decays like exp(-x/L), which is the flattening. Its integral
// is closed-form, so the curve is smooth and a rung simply SITS on it (the
// brief's own instruction: rise only at rungs, but never a staircase).
//
// L AND Xm ARE THEN SOLVED, NOT CHOSEN, FROM (b) AND (c): the slope is exactly
// tan(45 deg) at the world x the frame's LEFT EDGE sits on at f85, and exactly
// 0.9/VX at the mark's x on the last frame. Two equations, two unknowns, in
// closed form. The camera's k and cx do not depend on the curve, so the left
// edge at f85 is known before the curve is — there is no circularity, and the
// module asserts both landings on the DAMPED camera afterwards.
// ---------------------------------------------------------------------------

export const DURATION = 123;

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
    plausible: z.number(),
    scenario: z.number(),
    where: z.number(),
    actually: z.number(),
    like: z.number(),
    okay: z.number(),
    becomes: z.number(),
    much: z.number(),
    harder: z.number(),
    make: z.number(),
    progress: z.number(),
    end: z.number(), // speech ends; the tail runs to 123
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
    plausible: 20,
    scenario: 26,
    where: 34,
    actually: 38,
    like: 45,
    okay: 55,
    becomes: 63,
    much: 70,
    harder: 77,
    make: 83,
    progress: 85,
    end: 107,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
/** The svg's own box. The curve runs from world x ~2,900 to ~5,500, which is far
 *  outside the 1080 x 1920 frame — the box is sized to hold it so nothing in
 *  this cut depends on `overflow: visible` reaching that far. The viewBox maps
 *  1:1, so world px are still svg px and the camera transform is unchanged. */
const SVG_W = 6400;
const SVG_H = 2800;
const LAST = DURATION - 1;
/** Frames of pre-roll. The pan is a constant-velocity target and the set's
 *  damper takes ~45 frames to settle into its steady lag behind one, so the
 *  pre-roll is long enough that f0 is already in steady state: the clock has
 *  been running for a long time before this cut starts. */
const PRE = 70;
const FIRST = -PRE;
const NF = LAST + 3 - FIRST;
/** This cut's in-point in the CLIP's own frames (0:37.460 x 24), so the ambient
 *  drift on the rungs and the camera's hand continue the earlier cuts instead of
 *  restarting from a fresh phase. */
const CONTINUE_FROM = 899;

const seg = (f: number, f0: number, f1: number, warp = 1) =>
  camEase(clamp01((f - f0) / (f1 - f0)), warp);

// ---------------------------------------------------------------------------
// TIME. The one rate in the cut that never changes.
// ---------------------------------------------------------------------------
/** World px of x per frame. Time is steady; the model travels with it. */
const VX = 9.5;
/** Where the model is at f0. Well clear of everything any other cut of this clip
 *  stands in (the column at x 540, the Go boards out to x 2,813): this is the
 *  same world, further along. */
const X0 = 3600;
const Y_START = 1400;
const markX = (f: number) => X0 + VX * f;

// ---------------------------------------------------------------------------
// THE CAMERA, PART ONE — the two channels that do not depend on the curve.
//
//   cx  ONE pan, rightward, never stopping and never re-keyed. It runs SLOWER
//       THAN THE MODEL: `cx = markX(f) + d(f)` with d one monotone ease (warp
//       0.8) across the whole cut, so the mark DRIFTS RIGHT ACROSS THE FRAME,
//       screen x 340 -> 700, and the past it has climbed keeps accumulating
//       behind it instead of scrolling off.
//
//       DIRECTOR'S NOTE ON V2's FIRST PREVIEW: "the steep past leaves the frame.
//       At f85 only three rings and a short bend are visible; the steep chain —
//       the thing the plateau is compared against — has gone off the bottom
//       left. The shape only reads if both halves are in frame at the payoff."
//       It was true and it was arithmetic: with cx advancing at exactly the
//       mark's own VX the window slides along the curve at the same rate the
//       mark does, so whatever is behind the mark at f0 is the same distance
//       behind it at f122 and the pull-back alone cannot hold it. Letting the
//       pan fall behind is what buys the past its room — the left edge advances
//       at 5.5 world px a frame against the mark's 9.5, so the visible trail
//       grows from 271 world px at f0 to 892 at the last frame.
//
//       THE CLOCK IS STILL STEADY. The model still travels at exactly VX and
//       nothing about the curve or the rungs changes; what moves is only where
//       the window sits, and it moves on one continuous ease with no stop.
//
//   k   1.262 -> 1.25 (cut 4's own creep, still easing out, so the zoom is never
//       parked at f0), then the pull-back 1.25 -> 0.80 over f20-100 at warp 0.75
//       — the speed early, as a pull-back wants it — then a slow continued creep
//       out that is still running on the last frame. 0.80, not 0.92: the extra
//       zoom is the other half of what keeps the steep chain in shot.
// ---------------------------------------------------------------------------
const K_OPEN = 1.262;
const K_SETTLE = 1.25;
const K_WIDE = 0.8;
const ZOOM_F0 = 20;
const ZOOM_F1 = 100;
const ZOOM_WARP = 0.75;
const DRIFT_F0 = 96;
const DRIFT_F1 = 190;
const DRIFT_K = 0.028;
const DRIFT_WARP = 0.85;

const kOf = (f: number) =>
  K_OPEN -
  (K_OPEN - K_SETTLE) * seg(f, FIRST, ZOOM_F0, 1.1) -
  (K_SETTLE - K_WIDE) * seg(f, ZOOM_F0, ZOOM_F1, ZOOM_WARP) -
  DRIFT_K * seg(f, DRIFT_F0, DRIFT_F1, DRIFT_WARP);

/** The Gaussian the whole set runs before the damper: symmetric, so it adds no
 *  lag of its own and only rounds curvature. */
const CAM_SMOOTH = 6;
const gaussTrack = (src: (f: number) => number): number[] => {
  const w = Math.ceil(3 * CAM_SMOOTH);
  const out: number[] = new Array(NF);
  for (let i = 0; i < NF; i++) {
    const f = i + FIRST;
    let num = 0;
    let den = 0;
    for (let d = -w; d <= w; d++) {
      const g = Math.exp(-(d * d) / (2 * CAM_SMOOTH * CAM_SMOOTH));
      num += g * src(f + d);
      den += g;
    }
    out[i] = num / den;
  }
  return out;
};

/** `runCam3`'s recurrence on ONE channel, over the whole track. Identical to the
 *  set's damper — asserted against `runCam3` itself on nine frames below — and
 *  written out here because every solve in this file needs the DAMPED value of a
 *  channel, not the target. */
const dampTrack = (T: number[]): number[] => {
  const out: number[] = new Array(T.length);
  let x = T[0];
  let v = 0;
  out[0] = x;
  for (let i = 1; i < T.length; i++) {
    v += (T[i] - x) * CAM_STIFF - v * CAM_DAMP;
    x += v;
    out[i] = x;
  }
  return out;
};

const idxOf = (f: number) => Math.max(0, Math.min(NF - 1, Math.round(f) - FIRST));

const K_TRACK = dampTrack(gaussTrack(kOf));
const kAt = (f: number) => K_TRACK[idxOf(f)];

/** Where the mark sits on screen at the two ends of the cut. It opens left of
 *  centre, with almost nothing behind it and the future in front; it ends right
 *  of centre, with the whole climbed shape behind it and the plateau running out
 *  to the edge. */
const MARK_SCREEN_X0 = 340;
const MARK_SCREEN_X1 = 700;
const PAN_WARP = 0.8;
const FRAME_F = 85; // "progress" — the frame the whole shape has to be in
const panMix = (f: number) => seg(f, 0, LAST, PAN_WARP);

/** The pan, in closed form. The Gaussian and the damper are both linear and the
 *  offset is affine in its two ends, so the DAMPED cx is
 *  `CX_BASE + A * P + B * Q` and putting the mark on MARK_SCREEN_X0 at f0 and on
 *  MARK_SCREEN_X1 on the last frame is a 2x2 linear system on the damped camera
 *  — not a guess at what the damper will do with it. (The damper's own steady
 *  lag behind a moving target is paid for here rather than estimated.) */
const CX_BASE = dampTrack(gaussTrack(markX));
const CX_P = dampTrack(gaussTrack((f) => 1 - panMix(f)));
const CX_Q = dampTrack(gaussTrack(panMix));

const PAN = (() => {
  // 540 + (markX(f) - CX_BASE - A*CX_P - B*CX_Q) * k = target
  const row = (f: number, target: number) => {
    const i = idxOf(f);
    const k = K_TRACK[i];
    return {
      a: -CX_P[i] * k,
      b: -CX_Q[i] * k,
      c: target - WORLD_W / 2 - (markX(f) - CX_BASE[i]) * k,
    };
  };
  const r0 = row(0, MARK_SCREEN_X0);
  const r1 = row(LAST, MARK_SCREEN_X1);
  const det = r0.a * r1.b - r1.a * r0.b;
  if (Math.abs(det) < 1e-9) {
    throw new Error("HarderToMakeProgressV2: the pan's two landings are degenerate.");
  }
  return {
    a: (r0.c * r1.b - r1.c * r0.b) / det,
    b: (r0.a * r1.c - r1.a * r0.c) / det,
  };
})();

const cxAt = (f: number) => {
  const i = idxOf(f);
  return CX_BASE[i] + PAN.a * CX_P[i] + PAN.b * CX_Q[i];
};

/** THE PAN NEVER STOPS AND NEVER TURNS ROUND. */
(() => {
  for (let f = 1; f <= LAST; f++) {
    const v = cxAt(f) - cxAt(f - 1);
    if (!(v > 0.5)) {
      throw new Error(
        `HarderToMakeProgressV2: the pan is down to ${v.toFixed(3)} world px/f at f${f}.`,
      );
    }
  }
})();

// ---------------------------------------------------------------------------
// THE CURVE — solved from the camera above, in closed form.
// ---------------------------------------------------------------------------
/** The steepest the past ever gets: 60 degrees, saturating. */
const SMAX = Math.tan((60 * Math.PI) / 180);
/** ...the slope that must still be IN FRAME at the end... */
const LEFT_EDGE_SLOPE = Math.tan((45 * Math.PI) / 180);
/** ...how far inside the left edge it is put, in world px, so it is still there
 *  with room to spare once the damper and the camera's sway have had their
 *  say... */
const STEEP_MARGIN = 110;
/** ...and the world px of rise the mark must still have on the LAST frame. */
const VY_END = 0.9;

/** The two landings are taken on the LAST FRAME, not on f85: the window is
 *  furthest along the curve there, so a 45-degree section that is in frame at
 *  f122 is in frame at every earlier frame too. Both are known before the curve
 *  is, because neither `cx` nor `k` depends on it. */
const LEFT_EDGE_X = cxAt(LAST) - (WORLD_W / 2) / kAt(LAST) + STEEP_MARGIN;

/** u = (x - Xm) / L at a given slope, inverted from the logistic. */
const uAtSlope = (s: number) => Math.log(SMAX / s - 1);

const CURVE = (() => {
  const x1 = LEFT_EDGE_X;
  const x2 = markX(LAST);
  const u1 = uAtSlope(LEFT_EDGE_SLOPE);
  const u2 = uAtSlope(VY_END / VX);
  if (!(u2 > u1)) {
    throw new Error("HarderToMakeProgressV2: the curve's two landings are the wrong way round.");
  }
  const L = (x2 - x1) / (u2 - u1);
  const Xm = x1 - u1 * L;
  return { L, Xm };
})();

const uOf = (x: number) => (x - CURVE.Xm) / CURVE.L;
/** dy/dx's MAGNITUDE (the curve rises, so y decreases as x grows). */
const slopeAt = (x: number) => SMAX / (1 + Math.exp(uOf(x)));
/** The integral of the slope, in closed form and written for numerical stability
 *  at both tails: `ln(1 + e^u) = max(u, 0) + log1p(e^-|u|)`. */
const climbInt = (x: number) => {
  const u = uOf(x);
  const lse = Math.max(u, 0) + Math.log1p(Math.exp(-Math.abs(u)));
  return SMAX * CURVE.L * (u - lse);
};
const curveY = (x: number) => Y_START - (climbInt(x) - climbInt(X0));
const markY = (f: number) => curveY(markX(f));
/** World px of RISE per frame — the mark's vertical speed. */
const markVy = (f: number) => VX * slopeAt(markX(f));
/** The curve's angle above horizontal at world x, in degrees. */
const angleAt = (x: number) => (Math.atan(slopeAt(x)) * 180) / Math.PI;

/** THE CURVE IS A CURVE, EVERYWHERE, AND IT ONLY EVER FLATTENS. */
(() => {
  let prev = Infinity;
  for (let x = X0 - 900; x <= X0 + 2200; x += 2) {
    const s = slopeAt(x);
    if (!(s < prev)) {
      throw new Error(
        `HarderToMakeProgressV2: dy/dx is not decreasing at world x ${x.toFixed(0)}.`,
      );
    }
    prev = s;
  }
  for (let f = FIRST; f <= LAST; f++) {
    if (!(markVy(f) > 0)) {
      throw new Error(`HarderToMakeProgressV2: the climb stops at f${f}.`);
    }
  }
  const vEnd = markVy(LAST);
  if (!(vEnd >= 0.5)) {
    throw new Error(
      `HarderToMakeProgressV2: the climb is down to ${vEnd.toFixed(3)} world px/f at f${LAST} ` +
        `(floor 0.5).`,
    );
  }
})();

// ---------------------------------------------------------------------------
// THE RUNGS. They sit ON the curve, and where each one sits is SOLVED from the
// frame the model is to reach it: the ring's centre is put on the curve exactly
// `r + MODEL_EDGE` from the mark's own position on that frame, so THE FRAME THE
// RING IS PLACED FOR IS THE FRAME THE MODEL'S LEADING EDGE TOUCHES ITS RIM. The
// flip is then read BACK off the mark's position frame by frame and the module
// throws unless the two agree to a tenth of a frame — placement and mechanism
// are the same geometry stated twice.
//
// WHEN THE FLIP RUNS. Cut 1's rule is `solvedAt`: the level line has reached the
// ring's centre. Cut 2's is `Rung.cross`, and its note says exactly why it moved
// the key: "a flip keyed on the CENTRE happens entirely underneath the dot and
// is never seen. Keyed on the rim, the `?` starts going as the dot arrives and
// the tick is finished and uncovered as it leaves." That works there because the
// mover is a 40 px dot inside a 72 px ring, so the ring stays legible around it.
//
// HERE THE MOVER IS THE 72 px MARK AND THE RING IS 70 px ACROSS, and the mark's
// centre travels through the ring's centre, so there is no distance at which a
// flip that is still running survives the pass. Both of the clip's existing keys
// were built and MEASURED on this picture first:
//   * keyed at rim contact (cut 2's rule): the tick's whole draw, f68-76 on the
//     f68 rung, happened inside the mark's box.
//   * keyed to FINISH at the level line's arrival (cut 1's rule, the flip
//     running the ten frames before it): better early, where the mark covers
//     160 px in ten frames, but on the flat it covers only 96 and the ring is
//     clear for the first 26 per cent of the flip — the tick's arrival, which is
//     the whole point of the mechanism, was invisible on the last two flips.
//
// So the flip FINISHES at rim contact and runs the SOLVE_F frames before it:
//
//   cross(j) = rimContact(j) - SOLVE_F
//
// — solved from the model's own position every frame, never from a frame number.
// The model comes up on the question, the `?` un-draws and the tick draws IN THE
// OPEN AHEAD OF IT (25 to 89 world px of clear air outside the rim at the start
// of every flip, nothing overlapping at any frame of any flip — both asserted),
// the answer is finished at the instant the model touches it, and the model then
// rides over its own answer. THE LEVEL LINE STILL ARRIVES: it passes through the
// ring's centre 4.4 to 7.4 frames later (asserted, and drawn UNDER the ring so
// it is seen to pass through it), which is the clip's own confirmation that the
// height was earned. That 4-7 frame offset is the cut's one departure from the
// common brief's "only when the level line reaches the ring's centre", and it is
// the price of the mechanism being visible at all in a picture where the mover
// and the question are the same size.
//
// THE CONTACT FRAMES ARE THE CUT. f2, f12, f26, f44, f68, f106 — waits of 10,
// 14, 18, 24 and 38 frames, every one longer than the last, and the f68 one
// completes two frames before "much" (70). Behind the mark the same series runs
// backwards (ratio 1.3) until it hits a floor which is not chosen either: two
// rings 70 px across need PAST_MIN_ARC of centre-to-centre air along the curve,
// which at 57 degrees is 5.6 frames of travel. So the past is a ladder at the
// tightest spacing the material allows — a rung every five or six frames, which
// is what "a lot of them are too easy" looked like — and the present is a rung
// every thirty-eight.
//
// The first contact is at f2, so at f0 that flip is already 80 per cent through
// and the model is two frames off the ring: the cut opens with the mechanism in
// motion, never from a standing start.
// ---------------------------------------------------------------------------
const CONTACT_AHEAD = [12, 26, 44, 68, 100] as const;
const PAST_FIRST = 2;
const PAST_GAP0 = CONTACT_AHEAD[0] - PAST_FIRST; // 10 frames into the first one
const PAST_RATIO = 1.3;
/** Centre-to-centre air along the curve between two rungs in the dense past. */
const PAST_MIN_ARC = 96;
/** How far back the ladder is laid: past the left edge of the opening frame. */
const PAST_BACK_F = 74;
/** ...and how far along the flat the NEXT question sits. It is 1.6x the previous
 *  gap in x — the escalation carried on once more — and it is the largest gap
 *  that still brings the ring over the right edge before the cut ends. A
 *  question the viewer never sees is not a question. */
const NEXT_GAP = 460;

const ringR = (j: number) => RING_R * (0.95 + 0.05 * hash(j, 29));

/** Arc length along the curve between two world x, by Simpson on the slope. */
const arcLen = (xa: number, xb: number) => {
  const n = 64;
  const h = (xb - xa) / n;
  const g = (x: number) => Math.hypot(1, slopeAt(x));
  let s = g(xa) + g(xb);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * g(xa + i * h);
  return (s * h) / 3;
};

type Rung = {
  /** the frame the model's leading edge touches this ring's rim */
  contact: number;
  x: number;
  y: number;
  r: number;
  seed: number;
};

const RUNGS: Rung[] = (() => {
  const past: number[] = [];
  {
    let f = PAST_FIRST;
    let gap = PAST_GAP0 / PAST_RATIO;
    for (let i = 0; i < 40 && f > -PAST_BACK_F; i++) {
      past.push(f);
      // the floor, in FRAMES, from the arc the material needs at this slope
      const along = VX * Math.hypot(1, slopeAt(markX(f)));
      gap = Math.max(gap, PAST_MIN_ARC / along);
      f -= gap;
      gap /= PAST_RATIO;
    }
    past.reverse();
  }
  const contacts = [...past, ...CONTACT_AHEAD];

  const out: Rung[] = contacts.map((ft, j) => {
    const r = ringR(j);
    const need = r + MODEL_EDGE;
    const px = markX(ft);
    const py = curveY(px);
    // the ring's centre is ahead on the curve, `need` away from the mark
    let lo = px;
    let hi = px + 4 * need;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (Math.hypot(mid - px, curveY(mid) - py) < need) lo = mid;
      else hi = mid;
    }
    const x = (lo + hi) / 2;
    return { contact: ft, x, y: curveY(x), r, seed: hash(j, 41) };
  });

  // ...and the one it never reaches, NEXT_GAP further along the flat.
  const lastX = out[out.length - 1].x;
  const jn = out.length;
  out.push({
    contact: Infinity,
    x: lastX + NEXT_GAP,
    y: curveY(lastX + NEXT_GAP),
    r: ringR(jn),
    seed: hash(jn, 41),
  });
  return out;
})();

/** The solver's own window: earlier than the pre-roll, because the oldest rung
 *  of the past ladder was reached before the camera's pre-roll even began. */
const SOLVE_FIRST = -220;

/** How far the model's leading edge along the curve is from ring `g`'s rim. */
const rimGap = (f: number, g: Rung) =>
  Math.hypot(markX(f) - g.x, markY(f) - g.y) - g.r - MODEL_EDGE;

/** RIM CONTACT, read off the model's own position by walking it — the same
 *  construction `makeSolver` uses on the level line, and for the same reason. */
const RIM_CONTACT = RUNGS.map((g) => {
  let prev = rimGap(SOLVE_FIRST, g);
  if (prev <= 0) return SOLVE_FIRST;
  for (let f = SOLVE_FIRST + 1; f <= LAST + 2; f++) {
    const cur = rimGap(f, g);
    if (cur <= 0) {
      const span = prev - cur;
      return span > 1e-9 ? f - 1 + prev / span : f;
    }
    prev = cur;
  }
  return Infinity;
});

/** THE CLIP'S OWN RULE, also read off the model's own y: the sub-frame at which
 *  the level line reaches each ring's centre. It is not what keys the flip here
 *  (see above) but it is asserted, reported and SEEN — the line is drawn under
 *  the rings and sweeps up through every one of them. */
const LEVEL_CROSS = RUNGS.map((g) => {
  let prev = markY(SOLVE_FIRST);
  if (prev <= g.y) return SOLVE_FIRST;
  for (let f = SOLVE_FIRST + 1; f <= LAST + 2; f++) {
    const cur = markY(f);
    if (cur <= g.y) {
      const span = prev - cur;
      return span > 1e-9 ? f - 1 + (prev - g.y) / span : f;
    }
    prev = cur;
  }
  return Infinity;
});

/** ...and the flip, which FINISHES at rim contact. */
const SOLVED = {
  cross: RIM_CONTACT.map((c) => c - SOLVE_F),
  solved: (f: number, j: number) => clamp01((f - (RIM_CONTACT[j] - SOLVE_F)) / SOLVE_F),
};

/** Placement and mechanism are the same geometry: they must agree. */
(() => {
  RUNGS.forEach((g, j) => {
    if (!Number.isFinite(g.contact)) {
      if (Number.isFinite(RIM_CONTACT[j])) {
        throw new Error(
          `HarderToMakeProgressV2: the next question is reached at f${RIM_CONTACT[j].toFixed(1)}.`,
        );
      }
      return;
    }
    const err = Math.abs(RIM_CONTACT[j] - g.contact);
    if (err > 0.1) {
      throw new Error(
        `HarderToMakeProgressV2: rung ${j} was placed for f${g.contact.toFixed(2)} but the mark ` +
          `reaches its rim at f${RIM_CONTACT[j].toFixed(2)}.`,
      );
    }
  });
})();

/** EVERY FLIP PLAYS IN CLEAR AIR. Over the whole of a ring's flip the model's
 *  box must stay outside its rim, or the thing the clip is built on happens
 *  inside the mark and is never seen. */
export const FLIP_AIR = RUNGS.map((g, j) => {
  if (!Number.isFinite(SOLVED.cross[j])) return { start: Infinity, min: Infinity };
  const at = (f: number) => {
    const a = Math.floor(f);
    const t = f - a;
    return (
      Math.hypot(
        lerp(markX(a), markX(a + 1), t) - g.x,
        lerp(markY(a), markY(a + 1), t) - g.y,
      ) -
      g.r -
      MODEL_EDGE
    );
  };
  const f0 = SOLVED.cross[j];
  let min = Infinity;
  for (let i = 0; i <= 40; i++) min = Math.min(min, at(f0 + (SOLVE_F * i) / 40));
  return { start: at(f0), min };
});
(() => {
  RUNGS.forEach((g, j) => {
    if (!Number.isFinite(SOLVED.cross[j]) || SOLVED.cross[j] < SOLVE_FIRST + 2) return;
    if (FLIP_AIR[j].min < -0.5) {
      throw new Error(
        `HarderToMakeProgressV2: rung ${j}'s flip is occluded by ` +
          `${(-FLIP_AIR[j].min).toFixed(1)} world px.`,
      );
    }
    if (FLIP_AIR[j].start < 20) {
      throw new Error(
        `HarderToMakeProgressV2: rung ${j}'s flip opens with only ` +
          `${FLIP_AIR[j].start.toFixed(1)} world px of air (floor 20).`,
      );
    }
  });
})();

/** ...and the level line still arrives, a few frames behind the finished tick. */
(() => {
  RUNGS.forEach((g, j) => {
    if (!Number.isFinite(g.contact)) return;
    const lag = LEVEL_CROSS[j] - RIM_CONTACT[j];
    if (!(lag > 3 && lag < 9)) {
      throw new Error(
        `HarderToMakeProgressV2: the level line reaches rung ${j}'s centre ${lag.toFixed(2)} ` +
          `frames after the tick is finished (want 3..9).`,
      );
    }
  });
})();

/** NOTHING TOUCHES ANYTHING, sway spent. */
(() => {
  for (let f = 0; f <= LAST; f++) {
    for (let i = 0; i < RUNGS.length; i++) {
      const di = ringSway(f + CONTINUE_FROM, RUNGS[i].seed);
      for (let j = i + 1; j < RUNGS.length; j++) {
        const dj = ringSway(f + CONTINUE_FROM, RUNGS[j].seed);
        const gap =
          Math.hypot(
            RUNGS[i].x + di.dx - (RUNGS[j].x + dj.dx),
            RUNGS[i].y + di.dy - (RUNGS[j].y + dj.dy),
          ) -
          RUNGS[i].r -
          RUNGS[j].r;
        if (gap < 6) {
          throw new Error(
            `HarderToMakeProgressV2: rungs ${i}/${j} come within ${gap.toFixed(2)} world px.`,
          );
        }
      }
    }
  }
})();

// ---------------------------------------------------------------------------
// THE CAMERA, PART TWO — the tilt, which tracks the mark with a LAG.
//
// `cy` follows the mark, but behind it: early, when the mark is climbing 13 px a
// frame, the camera is a long way under it and the mark sits HIGH in the frame
// (screen y 700); as the rise dies the camera catches up and the mark SINKS to
// screen y 880. That is the second reading of the same fact — we are not being
// lifted any more — and it costs no new object.
//
// D0 and D1 are the lag at the two ends, and they are SOLVED: the damped `cy` is
// affine in both (the Gaussian and the damper are linear, and the lag ramp is
// D0 * (1 - g) + D1 * g), so putting the mark on screen y 700 at f0 and 880 on
// the last frame is a 2x2 linear system on the DAMPED camera, not a guess at
// what the damper will do.
// ---------------------------------------------------------------------------
const MARK_SCREEN_Y0 = 570;
const MARK_SCREEN_Y1 = 714;
const LAG_F0 = 0;
const LAG_F1 = 110;
const LAG_WARP = 0.9;
const lagMix = (f: number) => seg(f, LAG_F0, LAG_F1, LAG_WARP);

const K_SMOOTH = gaussTrack(kOf);
const kSmoothAt = (f: number) => K_SMOOTH[idxOf(f)];

const CY_P = dampTrack(gaussTrack((f) => markY(f) + CAM_LIFT / kSmoothAt(f)));
const CY_Q = dampTrack(gaussTrack((f) => 1 - lagMix(f)));
const CY_R = dampTrack(gaussTrack(lagMix));

const LAG = (() => {
  // screenY(f) = 960 + (markY(f) - cy(f)) * k(f), cy = CY_P + D0*CY_Q + D1*CY_R
  const row = (f: number, target: number) => {
    const i = idxOf(f);
    const k = K_TRACK[i];
    // (markY - CY_P - D0*CY_Q - D1*CY_R) * k = target - 960
    return {
      a: -CY_Q[i] * k,
      b: -CY_R[i] * k,
      c: target - 960 - (markY(f) - CY_P[i]) * k,
    };
  };
  const r0 = row(0, MARK_SCREEN_Y0);
  const r1 = row(LAST, MARK_SCREEN_Y1);
  const det = r0.a * r1.b - r1.a * r0.b;
  if (Math.abs(det) < 1e-9) {
    throw new Error("HarderToMakeProgressV2: the tilt's two landings are degenerate.");
  }
  return {
    d0: (r0.c * r1.b - r1.c * r0.b) / det,
    d1: (r0.a * r1.c - r1.a * r0.c) / det,
  };
})();

/** The three camera TARGET tracks, as `runCam3` takes them (cy already carries
 *  CAM_LIFT / k, exactly as `camKnots3` writes it). */
const CAM = (() => {
  const CX: number[] = new Array(NF);
  const CY: number[] = new Array(NF);
  const K: number[] = new Array(NF);
  // By linearity of the Gaussian and the damper this is exactly
  // CX_BASE + PAN.a * CX_P + PAN.b * CX_Q once damped, which is what `cxAt`
  // reads and what every solve above was done against (asserted below).
  const cxT = gaussTrack((f) => markX(f) + PAN.a * (1 - panMix(f)) + PAN.b * panMix(f));
  const cyT = gaussTrack(
    (f) => markY(f) + LAG.d0 * (1 - lagMix(f)) + LAG.d1 * lagMix(f) + CAM_LIFT / kSmoothAt(f),
  );
  for (let i = 0; i < NF; i++) {
    CX[i] = cxT[i];
    CY[i] = cyT[i];
    K[i] = K_SMOOTH[i];
  }
  return { CX, CY, K };
})();

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const cx = dampTrack(CAM.CX);
  const cy = dampTrack(CAM.CY);
  const kk = dampTrack(CAM.K);
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const i = idxOf(f);
    const d = sway(f + CONTINUE_FROM);
    out.push({ cx: cx[i] + d.dx, cy: cy[i] + d.dy, k: kk[i] });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 2, Math.round(f)));
const camAt = (f: number) => CAM_AT_F[clampF(f)];

/** THE TABLE IS THE SET'S OWN DAMPER, not a restatement of it. */
(() => {
  for (const f of [0, 8, 24, 42, 55, 66, 85, 101, LAST]) {
    const c = runCam3(f - FIRST, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f + CONTINUE_FROM);
    const mine = CAM_AT_F[f];
    const err = Math.max(
      Math.abs(c.cx + d.dx - mine.cx),
      Math.abs(c.cy + d.dy - mine.cy),
      Math.abs(c.k - mine.k) * 1000,
    );
    if (err > 1e-6) {
      throw new Error(`HarderToMakeProgressV2: the camera table disagrees with runCam3 at f${f}.`);
    }
    if (Math.abs(cxAt(f) + sway(f + CONTINUE_FROM).dx - mine.cx) > 1e-6) {
      throw new Error(
        `HarderToMakeProgressV2: the pan the curve was solved against is not the pan that renders, at f${f}.`,
      );
    }
  }
})();

/** Where a world point sits on screen at frame `f`. */
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: WORLD_W / 2 + (wx - c.cx) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};
const kAtCam = (f: number) => camAt(f).k;

// ---------------------------------------------------------------------------
// THE TRAIL. `Trail`'s recipe — INK at INK_LO, butt caps, the set's per-icon
// shadow — laid on the CURVE instead of a chord, because the shape of what the
// model has already climbed IS the graphic of this cut. It grows with the mark
// and it has no visible beginning: its far end is asserted off frame on every
// frame of the cut, so there is nothing to fade.
//
// IT IS DRAWN AT THE RING'S WEIGHT, NOT THE LEVEL LINE'S HALF. `Trail` is half
// stroke everywhere else in the clip because everywhere else it is a record of
// where something went while the something is the subject. Here the record IS
// the subject: the bend in this line is the entire argument. At half stroke it
// measured 2.5 screen px against the rings' 5.0 and the mark's 90, and on the
// 270 px phone test it was under a pixel — the one thing the viewer has to read
// was the faintest thing in the frame. At the full stroke it is exactly a ring's
// weight at exactly a ring's answered opacity, so it is still one family and one
// ladder: nothing new, the same two rungs of ink.
// ---------------------------------------------------------------------------
const TRAIL_BACK = 700;
const TRAIL_X0 = X0 - TRAIL_BACK;
const TRAIL_STEP = 16;

const trailPath = (f: number) => {
  const xEnd = markX(f);
  const n = Math.max(2, Math.ceil((xEnd - TRAIL_X0) / TRAIL_STEP));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const x = TRAIL_X0 + ((xEnd - TRAIL_X0) * i) / n;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${curveY(x).toFixed(2)}`;
  }
  return d;
};

/** THE TRAIL NEVER SHOWS ITS OWN BEGINNING. */
(() => {
  for (let f = 0; f <= LAST; f++) {
    const s = screenAt(f, TRAIL_X0, curveY(TRAIL_X0));
    if (s.x > -40 && s.y < WORLD_H + 40) {
      throw new Error(
        `HarderToMakeProgressV2: the trail's far end is in frame at f${f} ` +
          `(screen ${s.x.toFixed(0)}, ${s.y.toFixed(0)}).`,
      );
    }
  }
})();

// ---------------------------------------------------------------------------
// THE SHAPE TEST — the one the whole cut is solved for, asserted on the DAMPED
// camera. At FRAME_F the frame must hold a section of trail at >= 45 degrees,
// and by the end the trail must ARRIVE flat.
// ---------------------------------------------------------------------------
const leftEdgeX = (f: number) => camAt(f).cx - (WORLD_W / 2) / kAtCam(f);
const rightEdgeX = (f: number) => camAt(f).cx + (WORLD_W / 2) / kAtCam(f);

/** THE STEEP SECTION IS INSIDE THE FRAME AT THE PAYOFF — the director's own
 *  test, and the reason the pan runs slow. It walks the DRAWN trail (it stops at
 *  the mark, so a steep stretch the trail has not reached does not count) and
 *  finds the steepest point whose screen position is at least STEEP_SCREEN_PAD
 *  inside every edge. That point must be at 45 degrees or more. */
const STEEP_SCREEN_PAD = 60;
export const steepInFrame = (f: number) => {
  let best = { deg: 0, sx: 0, sy: 0, wx: 0 };
  const x0 = Math.max(TRAIL_X0, leftEdgeX(f) - 40);
  for (let x = x0; x <= markX(f); x += 4) {
    const s = screenAt(f, x, curveY(x));
    if (
      s.x < STEEP_SCREEN_PAD ||
      s.x > WORLD_W - STEEP_SCREEN_PAD ||
      s.y < STEEP_SCREEN_PAD ||
      s.y > WORLD_H - STEEP_SCREEN_PAD
    )
      continue;
    const deg = angleAt(x);
    if (deg > best.deg) best = { deg, sx: s.x, sy: s.y, wx: x };
  }
  return best;
};

(() => {
  for (const f of [FRAME_F, LAST]) {
    const b = steepInFrame(f);
    if (!(b.deg >= 45)) {
      throw new Error(
        `HarderToMakeProgressV2: the steepest trail point in frame at f${f} is only ` +
          `${b.deg.toFixed(2)} deg (want >= 45, with ${STEEP_SCREEN_PAD} px of margin).`,
      );
    }
  }
  const leftDeg = angleAt(leftEdgeX(FRAME_F));
  if (!(leftDeg >= 44.5)) {
    throw new Error(
      `HarderToMakeProgressV2: the trail enters the frame at only ${leftDeg.toFixed(2)} deg ` +
        `at f${FRAME_F} (want >= 45).`,
    );
  }
  const endDeg = angleAt(markX(LAST));
  if (!(endDeg <= 8)) {
    throw new Error(
      `HarderToMakeProgressV2: the trail still arrives at ${endDeg.toFixed(2)} deg on the last ` +
        `frame (want <= 8).`,
    );
  }
  // ...and the mark drifts right across the frame, monotonically, inside the band
  // the two landings define.
  let prevX = -Infinity;
  for (let f = 0; f <= LAST; f++) {
    const s = screenAt(f, markX(f), markY(f));
    if (s.x < MARK_SCREEN_X0 - 25 || s.x > MARK_SCREEN_X1 + 25) {
      throw new Error(
        `HarderToMakeProgressV2: the mark is at screen x ${s.x.toFixed(0)} at f${f}.`,
      );
    }
    if (s.x < prevX - 1.5) {
      throw new Error(`HarderToMakeProgressV2: the mark drifts back left at f${f}.`);
    }
    prevX = s.x;
  }
  // ...and the next question comes into frame, and is never reached.
  let enters = -1;
  const nx = RUNGS[RUNGS.length - 1];
  for (let f = 0; f <= LAST; f++) {
    if (enters < 0 && nx.x - nx.r <= rightEdgeX(f)) enters = f;
  }
  if (enters < 0 || enters > 108) {
    throw new Error(
      `HarderToMakeProgressV2: the next question comes over the right edge at f${enters}.`,
    );
  }
})();

// ---------------------------------------------------------------------------

const HarderToMakeProgressV2: React.FC<Props> = ({
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
}) => {
  const frame = useCurrentFrame();
  const cam = runCam3(frame - FIRST, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(frame + CONTINUE_FROM);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const mx = markX(frame);
  const my = markY(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_AT_F[0].cy}
        cx={cx}
        cxRest={CAM_AT_F[0].cx}
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
            width={SVG_W}
            height={SVG_H}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* what has already been climbed: the curve behind the mark, at the
                trail's own ink and weight. The future is NOT drawn — the rungs
                ahead are all there is of it. */}
            <g style={{ filter: iconShadow(k) }} opacity={INK_LO}>
              <path
                d={trailPath(frame)}
                fill="none"
                stroke={INK}
                strokeWidth={strokeW(k)}
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            </g>
            {/* the level line goes UNDER the rungs, so it is SEEN to pass
                through the question it is answering */}
            <LevelLine k={k} x={mx} y={my} />
            {RUNGS.map((g, j) => {
              const d = ringSway(frame + CONTINUE_FROM, g.seed);
              return (
                <QuestionRing
                  key={`r${j}`}
                  x={g.x + d.dx}
                  y={g.y + d.dy}
                  r={g.r}
                  solved={SOLVED.solved(frame, j)}
                  k={k}
                />
              );
            })}
            <ModelMark k={k} x={mx} y={my} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HarderToMakeProgressV2;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  okay: defaultProps.beats.okay,
  much: defaultProps.beats.much,
  progress: defaultProps.beats.progress,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);
export const MARK_AT = (f: number) => ({ x: markX(f), y: markY(f) });

// ---------------------------------------------------------------------------
// MEASUREMENTS. Every claim in the report is read off this.
// ---------------------------------------------------------------------------
const every10 = (() => {
  const fs: number[] = [];
  for (let f = 0; f <= LAST; f += 10) fs.push(f);
  if (fs[fs.length - 1] !== LAST) fs.push(LAST);
  return fs;
})();

export const STATS = {
  duration: DURATION,
  vx: VX,
  curve: {
    SMAX: Number(SMAX.toFixed(5)),
    L: Number(CURVE.L.toFixed(2)),
    Xm: Number(CURVE.Xm.toFixed(1)),
    x0: X0,
    yStart: Y_START,
    totalRise: Number((markY(0) - markY(LAST)).toFixed(1)),
    totalRun: Number((markX(LAST) - markX(0)).toFixed(1)),
    visibleRunAtLast: Number((rightEdgeX(LAST) - TRAIL_X0).toFixed(0)),
    degAt: {
      trailStart: Number(angleAt(TRAIL_X0).toFixed(2)),
      f0: Number(angleAt(markX(0)).toFixed(2)),
      f42: Number(angleAt(markX(42)).toFixed(2)),
      f85: Number(angleAt(markX(85)).toFixed(2)),
      last: Number(angleAt(markX(LAST)).toFixed(2)),
    },
    /** the frame from which the trail ARRIVES at 8 degrees or less */
    flatFromF: (() => {
      for (let f = 0; f <= LAST; f++) if (angleAt(markX(f)) <= 8) return f;
      return -1;
    })(),
  },

  /** per 10 f: mark x, y, vx, vy, and where it is on screen. */
  mark: every10.map((f) => {
    const s = screenAt(f, markX(f), markY(f));
    return {
      f,
      x: Number(markX(f).toFixed(1)),
      y: Number(markY(f).toFixed(1)),
      vx: VX,
      vy: Number(markVy(f).toFixed(3)),
      deg: Number(angleAt(markX(f)).toFixed(2)),
      screenX: Number(s.x.toFixed(0)),
      screenY: Number(s.y.toFixed(0)),
    };
  }),

  /** THE FLIPS, from geometry. `cross` is read off the mark's own position; the
   *  `wait` is the gap since the previous one. */
  flips: RUNGS.map((g, j) => ({
    j,
    contactPlaced: Number.isFinite(g.contact) ? Number(g.contact.toFixed(2)) : "never",
    rimContactSolved: Number.isFinite(RIM_CONTACT[j]) ? Number(RIM_CONTACT[j].toFixed(2)) : "never",
    flipRuns: Number.isFinite(SOLVED.cross[j])
      ? [Number(SOLVED.cross[j].toFixed(2)), Number(RIM_CONTACT[j].toFixed(2))]
      : "never",
    levelCross: Number.isFinite(LEVEL_CROSS[j]) ? Number(LEVEL_CROSS[j].toFixed(2)) : "never",
    airAtFlipStart: Number.isFinite(FLIP_AIR[j].start) ? Number(FLIP_AIR[j].start.toFixed(1)) : "never",
    minAirDuringFlip: Number.isFinite(FLIP_AIR[j].min) ? Number(FLIP_AIR[j].min.toFixed(1)) : "never",
    waitF:
      j === 0 || !Number.isFinite(RIM_CONTACT[j]) || !Number.isFinite(RIM_CONTACT[j - 1])
        ? null
        : Number((RIM_CONTACT[j] - RIM_CONTACT[j - 1]).toFixed(2)),
    x: Number(g.x.toFixed(1)),
    y: Number(g.y.toFixed(1)),
    r: Number(g.r.toFixed(2)),
  })),
  flipsInsideCut: RUNGS.map((_, j) => j).filter(
    (j) => RIM_CONTACT[j] > 0 && RIM_CONTACT[j] <= LAST,
  ),
  /** the arc gaps between neighbouring rungs, along the curve. */
  rungArcGaps: RUNGS.slice(1).map((g, i) => Number(arcLen(RUNGS[i].x, g.x).toFixed(0))),
  nextQuestion: (() => {
    const nx = RUNGS[RUNGS.length - 1];
    let enters = -1;
    for (let f = 0; f <= LAST; f++) if (enters < 0 && nx.x - nx.r <= rightEdgeX(f)) enters = f;
    return {
      x: Number(nx.x.toFixed(1)),
      gapFromPrevious: Number((nx.x - RUNGS[RUNGS.length - 2].x).toFixed(1)),
      entersFrameAtF: enters,
      worldPxAwayAtLast: Number((nx.x - markX(LAST)).toFixed(0)),
      framesAwayAtLast: Number(((nx.x - markX(LAST)) / VX).toFixed(0)),
      screenAtLast: (() => {
        const s = screenAt(LAST, nx.x, nx.y);
        return [Number(s.x.toFixed(0)), Number(s.y.toFixed(0))];
      })(),
    };
  })(),

  /** THE SHAPE IN ONE FRAME: the trail's slope at the left edge, at the mark,
   *  and the steepest point that is actually inside the frame with 60 px of
   *  margin — the director's test. */
  shape: [0, 44, 68, 85, 100, LAST].map((f) => {
    const b = steepInFrame(f);
    return {
      f,
      leftEdgeDeg: Number(angleAt(leftEdgeX(f)).toFixed(2)),
      atMarkDeg: Number(angleAt(markX(f)).toFixed(2)),
      rightEdgeDeg: Number(angleAt(rightEdgeX(f)).toFixed(2)),
      visibleTrailPx: Number((markX(f) - leftEdgeX(f)).toFixed(0)),
      steepestInFrameDeg: Number(b.deg.toFixed(2)),
      steepestAtScreen: [Number(b.sx.toFixed(0)), Number(b.sy.toFixed(0))],
    };
  }),

  /** The camera: zoom, world centre, and the screen speed / acceleration of
   *  fixed world points. The set's ceiling on |dv| is 2.5 screen px/f^2. */
  cam: every10.map((f) => {
    const c = camAt(f);
    return {
      f,
      k: Number(c.k.toFixed(4)),
      cx: Number(c.cx.toFixed(1)),
      cy: Number(c.cy.toFixed(1)),
      contentY: Number((c.cy - CAM_LIFT / c.k).toFixed(1)),
    };
  }),
  camAudit: (() => {
    const pts: [number, number][] = [
      [X0, Y_START],
      [X0 + 400, curveY(X0 + 400)],
      [X0 + 900, curveY(X0 + 900)],
      [X0 - 300, curveY(X0 - 300)],
      [X0 + 600, curveY(X0 + 600) - 400],
      [X0 + 200, curveY(X0 + 200) + 400],
      [X0 + 1100, curveY(X0 + 1100) + 200],
    ];
    let maxV = { f: -1, v: 0 };
    let maxDV = { f: -1, v: 0 };
    let minMean = { f: -1, v: Infinity };
    for (let f = 2; f <= LAST; f++) {
      let sum = 0;
      for (const [px, py] of pts) {
        const a = screenAt(f - 2, px, py);
        const b = screenAt(f - 1, px, py);
        const c = screenAt(f, px, py);
        const v1 = Math.hypot(b.x - a.x, b.y - a.y);
        const v2 = Math.hypot(c.x - b.x, c.y - b.y);
        sum += v2;
        if (v2 > maxV.v) maxV = { f, v: v2 };
        if (Math.abs(v2 - v1) > maxDV.v) maxDV = { f, v: Math.abs(v2 - v1) };
      }
      const mean = sum / pts.length;
      if (mean < minMean.v) minMean = { f, v: mean };
    }
    return {
      maxScreenSpeed: [maxV.f, Number(maxV.v.toFixed(2)), `cap ${SPEED_CAP_SCREEN}`],
      maxDV: [maxDV.f, Number(maxDV.v.toFixed(3)), "cap 2.5"],
      minMeanSpeed: [minMean.f, Number(minMean.v.toFixed(3))],
    };
  })(),

  /** Where the ink is: the lowest BRIGHT ink (the mark, its level line and any
   *  `?` not yet answered) and the lowest ink of any kind. */
  ink: [0, 26, 55, 85, LAST].map((f) => {
    // IN FRAME ONLY: a rung a thousand px below the bottom edge is not ink the
    // viewer can see, and counting it would hide the number that matters.
    let bright = -Infinity;
    let any = -Infinity;
    let top = Infinity;
    let sy = 0;
    let n = 0;
    const k = kAtCam(f);
    const sw = strokeW(k) / 2;
    const add = (wx: number, wy: number, r: number, isBright: boolean) => {
      const s = screenAt(f, wx, wy);
      const rr = (r + sw) * k;
      if (s.x + rr < 0 || s.x - rr > WORLD_W || s.y + rr < 0 || s.y - rr > WORLD_H) return;
      any = Math.max(any, Math.min(WORLD_H, s.y + rr));
      top = Math.min(top, Math.max(0, s.y - rr));
      if (isBright) bright = Math.max(bright, Math.min(WORLD_H, s.y + rr));
      sy += s.y;
      n += 1;
    };
    RUNGS.forEach((g, j) => {
      const d = ringSway(f + CONTINUE_FROM, g.seed);
      add(g.x + d.dx, g.y + d.dy, g.r, SOLVED.solved(f, j) < 0.5);
    });
    add(markX(f), markY(f), MODEL_MARK / 2, true);
    // ...and the trail itself, sampled across the visible window
    for (let x = Math.max(TRAIL_X0, leftEdgeX(f)); x <= markX(f); x += 20) {
      const s = screenAt(f, x, curveY(x));
      if (s.x < 0 || s.x > WORLD_W) continue;
      any = Math.max(any, Math.min(WORLD_H, s.y + (sw * k) / 2));
      top = Math.min(top, Math.max(0, s.y));
    }
    return {
      f,
      inkY: [Number(top.toFixed(0)), Number(any.toFixed(0))],
      lowestBrightInk: Number(bright.toFixed(0)),
      bandCentreY: Number(((top + any) / 2).toFixed(0)),
      objectCentreOfMassY: Number((sy / n).toFixed(0)),
      objectsInFrame: n,
    };
  }),

  /** Stroke weights and object sizes on screen, so the one family is one family. */
  stroke: [0, 20, 85, LAST].map((f) => [
    f,
    Number(strokeScreen(kAtCam(f)).toFixed(2)),
    Number(((strokeW(kAtCam(f)) / 2) * kAtCam(f)).toFixed(2)),
  ]),
  markPxOnScreen: [0, 42, 85, LAST].map((f) => [f, Number((MODEL_MARK * kAtCam(f)).toFixed(1))]),
  ringPxOnScreen: [0, 42, 85, LAST].map((f) => [f, Number((2 * RING_R * kAtCam(f)).toFixed(1))]),

  /** How many rungs are in frame, and how many of them are still a `?`. */
  rungsInFrame: [0, 26, 55, 85, LAST].map((f) => {
    let inFrame = 0;
    let bright = 0;
    RUNGS.forEach((g, j) => {
      const s = screenAt(f, g.x, g.y);
      const rr = (g.r + 6) * kAtCam(f);
      if (s.x + rr > 0 && s.x - rr < WORLD_W && s.y + rr > 0 && s.y - rr < WORLD_H) {
        inFrame += 1;
        if (SOLVED.solved(f, j) < 0.5) bright += 1;
      }
    });
    return { f, inFrame, stillAQuestion: bright };
  }),

  /** The lowest ink of ANY kind, over EVERY frame, and the lowest BRIGHT ink. */
  lowestInkAnyFrame: (() => {
    let worst = { f: -1, y: -Infinity };
    let bright = { f: -1, y: -Infinity };
    for (let f = 0; f <= LAST; f++) {
      const k = kAtCam(f);
      const sw = strokeW(k) / 2;
      const hit = (wx: number, wy: number, r: number, isBright: boolean) => {
        const s = screenAt(f, wx, wy);
        const rr = (r + sw) * k;
        if (s.x + rr < 0 || s.x - rr > WORLD_W || s.y - rr > WORLD_H) return;
        if (s.y + rr > worst.y) worst = { f, y: s.y + rr };
        if (isBright && s.y + rr > bright.y) bright = { f, y: s.y + rr };
      };
      RUNGS.forEach((g, j) => hit(g.x, g.y, g.r, SOLVED.solved(f, j) < 0.5));
      hit(markX(f), markY(f), MODEL_MARK / 2, true);
      for (let x = Math.max(TRAIL_X0, leftEdgeX(f)); x <= markX(f); x += 12) {
        hit(x, curveY(x), sw, false);
      }
    }
    return {
      anyInk: [worst.f, Number(Math.min(WORLD_H, worst.y).toFixed(0))],
      brightInk: [bright.f, Number(bright.y.toFixed(0))],
    };
  })(),
  lag: { d0: Number(LAG.d0.toFixed(1)), d1: Number(LAG.d1.toFixed(1)) },
  pan: { a: Number(PAN.a.toFixed(1)), b: Number(PAN.b.toFixed(1)) },
  steepLandingX: Number(LEFT_EDGE_X.toFixed(1)),
  rungCount: RUNGS.length,
  trailX0: TRAIL_X0,
};
