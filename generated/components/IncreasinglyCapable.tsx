import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
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
import {
  CURVE_AT as curveAt,
  DOT_R,
  SPINE_OPACITY,
  STREAM_V,
  STROKE,
  TIP_DRIFT,
  TIP_STREAM,
  cometPath,
  spinePath,
} from "./GoodTrajectory";
import type { Drawn } from "./GoodTrajectory";
import {
  CAM_AT as SBS_CAM_AT,
  DURATION as SBS_DURATION,
  RING_R,
  SIGN_PATH as SBS_SIGN_PATH,
  S_TICK,
} from "./SignsBeforeSerious";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Children`, cut `IncreasinglyCapable` — the THIRD cut, which
// returns to the standing picture and turns cut 2's one threshold into a ladder:
// "In the same way, as these, like, AI models become — and I don't want to
//  over-anthropomorphize, but I think it's true that, like, as the AI has
//  become increasingly capable"
//
// DURATION. The composition starts at 13.380 s and speech ends at 19.380 s:
//   DURATION = round((19.380 - 13.380) * 24) + 16 = 144 + 16 = 160
//
// Word onsets, frame = round((t - 13.380) * 24):
//   in 0 · same 3 · way 7 · as 11 · these 15 · AI 21 · models 26 · BECOME 32
//   (ends 44) · and 44 · don't 48 · over 52 · ANTHROPOMORPHIZE 61 (ends 79) ·
//   BUT 79 · think 84 · true 90 · that 93 · as 99 · AI 105 · has 109 ·
//   BECOME 111 · like 117 · INCREASINGLY 120 · CAPABLE 129 (ends 144) ·
//   tail 144-160.
export const DURATION = 160;

// ---------------------------------------------------------------------------
// EDITORIAL CONTEXT. The five seconds before this cut are the speaker's face
// (the children analogy), so this cut RETURNS to the standing picture rather
// than continuing a shot — it may open on cut 2's closing framing and it does,
// already drifting, but nothing about the arrangement has to match frame for
// frame and no viewer can check. The line AFTER it is "they will, if they take
// deceptive actions, it will be kind of obvious first", which is a likely next
// pick, so this cut ends OPEN: the pull-back is still arriving at its widest on
// "capable" and the 16-frame tail is a decaying drift over a picture that is
// still flowing, not a full stop.
//
// ---------------------------------------------------------------------------
// CONTINUITY OF THE WORLD. World time is 307 + f — cut 2's 110 plus the 197
// frames since it began. Everything that decides how the picture LOOKS is
// imported: GoodTrajectory's curve table, comet path, spine and weights, and
// SignsBeforeSerious' threshold arc and ring radius. What is re-derived here,
// and only here, is the SEATING and the FLOW, because this cut's velocity field
// is not cut 2's (see THE LADDER) and a strip seated for a constant speed
// cannot be reused under a varying one. The picture is the same: the same
// blue-noise strip at 0.14 comets per world px of arc at the base speed, the
// same feathered and undulating edge, the same wander, the same tick at arc
// 1900, the same three ringed signs low on the curve.
//
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "the further up the line they get, the bigger, wider and faster they are,
//    and there are three marks where each step happens; for a moment one of them
//    turns into a little person and then back into a comet."
//
// ---------------------------------------------------------------------------
// THE LADDER, AND THE CONTINUITY EQUATION. Cut 2 established one threshold: a
// comet that crosses the tick swells and the corridor widens. This cut makes it
// three, at arcs 1900, 2500 and 3100, and adds the thing that makes the ladder
// hold together — SPEED.
//
//   tier 1 (cut 2's tick)  radius x1.45  lateral x1.6   speed x1.3
//   tier 2                 radius x1.40  lateral x1.39  speed x1.20
//   tier 3                 radius x1.40  lateral x1.39  speed x1.20
// (the briefed 1.45 / 1.40 made the top of the ladder THINNER than the bottom —
//  see DEVIATIONS; at these the coverage rises to about 1.5x the base tier's)
//
// A comet's arc position is therefore not seat + v * f. It is the path of a
// particle through a velocity field that varies along the curve:
//     ds/df = v(s),   s(f) = S(tau_seat + f),   tau(s) = integral ds / v(s)
// and a seat is labelled by its tau rather than by an arc position. Seating the
// strip at a CONSTANT DENSITY IN TAU then makes the linear density in s fall as
// 1 / v automatically: that is the continuity equation, and it is what stops the
// ladder fusing. Where a comet is 2.84x its base radius it is also travelling
// 2.55x as fast and standing 3.36x as far off the line, so the fraction of the
// corridor covered by ink is within 6% of what it is at the bottom, at every
// tier, by construction — and the multipliers are then chosen so it does not
// merely hold but RISES to about 1.5x by tier 3. More capable is bigger, wider,
// faster AND denser, and the flux — comets per frame past any point — is the
// same everywhere.
//
// The radius and the speed ramp over TIER_GROW of arc, short enough that a
// comet is visibly mid-swell as it crosses a bar. The lateral ramp cannot be:
// it is a sideways motion, so it is rate limited against the LOCAL speed the
// way cut 2's was against 7 — no comet's velocity ever leaves the curve's
// tangent by more than the set's 15 degrees.
//
// ---------------------------------------------------------------------------
// GESTURES — the word each lands on, the frames it runs over. One continuous
// motion; nothing starts from a dead stop and nothing stops.
//
//  1. f0-44   "in the same way,    THE RETURN. Opens on cut 2's closing camera
//             as these AI models   with its drift still running, and one glide
//             become" (f32)        up the curve toward the first tick, easing in
//                                  to k 1.30. On BECOME (f32) a comet is mid-
//                                  swell on the tick near the middle of frame.
//  2. f40-79  "and I don't want    THE PERSON, half-drawn. The push does not
//             to over-anthropo-    stop: it runs on into a close-up (k 2.05) of
//             morphize" (f61)      ONE comet that has just crossed tick 1, and
//                                  the camera RIDES it — the pan's target IS its
//                                  arc path — so it holds at the frame's content
//                                  centre while the spine, the tick, the grid and
//                                  every comet in a different tier slide past.
//                                  And it SHIFTS SHAPE: the comet's own body
//                                  becomes a person — a head over a shoulder
//                                  dome with a neck gap, in its own orange,
//                                  still trailing its tail along its heading —
//                                  over f50-68, in a pocket cleared of other
//                                  comets. See V2 below.
//  3. f76-99  "but I think it's    THE RETRACTION. It holds as a person through
//             true that" (f79)     "anthropomorphize" (f68-78), the wander still
//                                  alive on it, and then the same one shape eases
//                                  back to a comet over f78-94. It was never
//                                  anything but a comet. The camera is easing out
//                                  up underneath it — there is no pause between
//                                  the retreat and the pull.
//  4. f92-144 "as the AI has       THE LADDER. One long pull-back and rise. Tick
//             become increasingly  2 draws centre-out over f94-104 and a comet is
//             capable"             mid-swell on it on BECOME (f111); tick 3 over
//             (f111/f120/f129)     f112-122, mid-swell on INCREASINGLY (f120-126).
//                                  On CAPABLE (f129) the frame is arriving at its
//                                  widest and the whole ladder is in one picture:
//                                  small comets at the bend, three bars, each
//                                  tier bigger, wider and faster than the last,
//                                  the biggest stream pouring out of the top, and
//                                  the three ringed signs small at the bottom.
//  5. f144-160 tail                Decaying drift. Everything keeps flowing; the
//                                  pull-back is still opening on the last frame.
//
// LIVENESS — none of it is on a word and none of it stops: the stream itself,
// each comet's own wander, the ticks' arrival, the outline drawing and
// un-drawing, the three signs' lazy saturated drift, the grid's parallax, and a
// camera that never parks.
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * THE RIDER HAS A POCKET: the 30 seats that would fall within 1.25 x the
//     figure's reach during f44-100 are simply not seated, once, at strip level,
//     so the shape has clear grey around it. The pocket travels with the rigid
//     strip — it is an airy spot in the stream, never an animated hole. It is
//     still sized off the V1 outline's reach (5.5 comet radii), which is larger
//     than the person needs (its own reach is 4.3): keeping it means the strip,
//     and therefore every other comet in the cut, is bit for bit what V1
//     delivered. Verified by difference blend: f32, f44, f104 and f135 differ
//     from the delivered V1 only at the ProRes noise floor (max 3, no bbox above
//     it), and f61, f72, f84 differ only inside the rider's own neighbourhood.
//   * THE RESOLVED FRAME IS THE LADDER, and the three ringed signs are allowed
//     to be small and off to one side rather than framed. Solving around them
//     made the box enormous and the ladder came out at k 0.44, leaning left,
//     with the right third empty. It is now k 0.64 with the steep leg standing
//     on the frame's own vertical axis and tick 3 hung at screen y 325.
//   * TIERS 2 AND 3 RUN AT 1.2x, NOT 1.4x, and their lateral at 1.39 not 1.45.
//     At 1.4 the coverage at tier 3 came out at 0.94 of the base tier's — the
//     top of the ladder was THINNER than the bottom, which is the opposite of
//     "increasingly capable". At 1.2 it is about 1.5x, so the ladder gets denser
//     as it gets bigger. The widening is also softened at the corridor's edge
//     (to m^0.75 at |d| = D_BASE) so the outermost seats are not flung out into
//     stragglers and the top tier keeps a feathered boundary.
//   * THE RIDDEN COMET IS 70 WORLD PX OFF THE LINE, not the one nearest it. A
//     comet on the axis has the spine running through it and an outline drawn
//     over it is swallowed by the spine's stroke; 70 px out it is clear, and the
//     camera riding it puts the spine agreeably off-centre.
//   * THE CAPTION BAND IS NOT CLEAR DURING THE CLOSE-UP. From f40 to about f124
//     the camera is between k 1.24 and 2.05 on a stream that runs nearly
//     vertically up the frame, so comets necessarily occupy the bottom of it —
//     36 of them at the tightest. There is no framing that avoids this and also
//     gives the briefed close-up. The band is clear on the opening frames and
//     from f124 to the end, which is where the captions have something to be
//     read against.
//   * THE RIDE IS JUDGED ON THE RIDER, as the brief allows. Fixed world points
//     measure |dv| 2.482 outside f44-98; inside it the rider holds at screen
//     x 537-549, y 820-861 over f56-80 against a content centre of (540, 835).
//     The pan's target carries the damper's own lead — CAM_DAMP / CAM_STIFF
//     times the rider's velocity — so the comet sits where it is aimed rather
//     than trailing behind it.
//   * THE SPINE LEAVES THE LEFT EDGE 1-8 PX BELOW THE 1450 LINE on the last two
//     frames (1451 at f144, 1449 at f159). Hanging the framing on tick 3 at
//     screen y 325 and clearing the caption band pull against each other, and
//     325 is as high as tick 3 goes before the top of the stream starts leaving
//     the frame.
//
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
    become1: z.number(),
    anthro: z.number(),
    but: z.number(),
    become2: z.number(),
    increasingly: z.number(),
    capable: z.number(),
    end: z.number(),
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
  beats: { become1: 32, anthro: 61, but: 79, become2: 111, increasingly: 120, capable: 129, end: 144 },
});

const CX = FRAME_W / 2;
/** Cut 2's clock carried on: its 110 plus the 197 frames since it began. */
export const W0 = 307;

// ---------------------------------------------------------------------------
// THE LADDER.
// ---------------------------------------------------------------------------
export const TIERS = [
  { s: S_TICK, r: 1.45, d: 1.6, v: 1.3 },
  { s: 2500, r: 1.4, d: 1.39, v: 1.2 },
  { s: 3100, r: 1.4, d: 1.39, v: 1.2 },
];
// COVERAGE, which is what "increasingly capable" has to FEEL like. The fraction
// of the corridor covered by ink goes as r^2 / (v * w). At the first build's
// 1.4x speed on tiers 2 and 3 that came out at 0.94 of the base tier's — the
// top of the ladder was thinner than the bottom, which is the opposite of the
// line. At 1.2, with the lateral trimmed from 1.45 to 1.39, tier 3 carries
//     2.842^2 / (1.872 * 3.091) = 1.40
// times the base tier's coverage: bigger, wider, faster AND denser.
/** The widening is softened at the corridor's edge, so the outermost seats are
 *  not flung out into stragglers and the top tier keeps a feathered boundary:
 *  the multiplier falls to m^0.75 at |d| = D_BASE. */
const EDGE_SOFT = 0.25;
/** The arc a comet takes to swell and to speed up: short, so the change is
 *  visibly happening AT the bar. */
const TIER_GROW = 260;
/** The lateral ramp is a sideways motion, so it is rate limited — as a fraction
 *  of the LOCAL along-curve speed, which is what keeps the angle constant as the
 *  ladder gets faster. */
const LAT_FRAC = 0.2;
const LAT_SPAN_MIN = 220;
const D_BASE = 150; // the corridor's half-width at the bottom, cut 2's

/** How far through tier `i` an arc position is, for radius and speed. */
const growAt = (s: number, i: number) =>
  smoothstep(clamp01((s - TIERS[i].s) / TIER_GROW));

/** ...and for the lateral, whose span depends on how far out the comet already
 *  is when it gets there and how fast it is going. */
const latSpan = (i: number, dAtTier: number) =>
  Math.max(LAT_SPAN_MIN, (1.5 * (TIERS[i].d - 1) * Math.abs(dAtTier)) / LAT_FRAC);

export const radiusMul = (s: number) =>
  TIERS.reduce((a, t, i) => a * (1 + (t.r - 1) * growAt(s, i)), 1);
export const speedMul = (s: number) =>
  TIERS.reduce((a, t, i) => a * (1 + (t.v - 1) * growAt(s, i)), 1);
export const lateralMul = (s: number, d0: number) => {
  let m = 1;
  for (let i = 0; i < TIERS.length; i++) {
    const span = latSpan(i, d0 * m);
    m *= 1 + (TIERS[i].d - 1) * smoothstep(clamp01((s - TIERS[i].s) / span));
  }
  const soft = 1 - EDGE_SOFT * clamp01(Math.abs(d0) / D_BASE);
  return Math.pow(m, soft);
};

// ---------------------------------------------------------------------------
// THE FLOW. tau(s) is the time a particle takes to reach s; S is its inverse.
// Built once, at 1 world px of arc, over everything the cut can show.
// ---------------------------------------------------------------------------
const S_MIN = -500;
const S_MAX = 4600;
const TAU: number[] = (() => {
  const out = [0];
  for (let s = S_MIN + 1; s <= S_MAX; s++) {
    out.push(out[out.length - 1] + 1 / (STREAM_V * speedMul(s - 0.5)));
  }
  return out;
})();
export const tauAt = (s: number) => {
  const i = Math.max(0, Math.min(TAU.length - 2, Math.floor(s - S_MIN)));
  return TAU[i] + (TAU[i + 1] - TAU[i]) * (s - S_MIN - i);
};
export const S_OF = (t: number) => {
  if (t <= TAU[0]) return S_MIN + (t - TAU[0]) * STREAM_V;
  if (t >= TAU[TAU.length - 1]) return S_MAX + (t - TAU[TAU.length - 1]) * STREAM_V * speedMul(S_MAX);
  let lo = 0;
  let hi = TAU.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (TAU[m] < t) lo = m;
    else hi = m;
  }
  return S_MIN + lo + (t - TAU[lo]) / Math.max(1e-9, TAU[hi] - TAU[lo]);
};

// ---------------------------------------------------------------------------
// THE STRIP, seated in tau. Constant spacing in tau is constant FLUX: the same
// number of comets pass any point per frame, everywhere on the ladder, and the
// linear density falls as 1 / v on its own.
// ---------------------------------------------------------------------------
const STRIP_DENSITY = 0.14; // comets per world px of arc at the base speed
const D_TAU = 1 / (STRIP_DENSITY * STREAM_V);
const STRIP_CELL = 2.45 * DOT_R;
const STRIP_FEATHER = 4.5;
const STRIP_WOBBLE = 26;
const SEP_K = 2.6;
const SEP_RELAX = 0.55;
const SEP_PASSES = 36;
const S_METRIC = 0.8;
const WANDER_A = 3.4;
const WANDER_T0 = 55;
const WANDER_T1 = 80;

const LAT_CDF: number[] = (() => {
  const N = 240;
  const out: number[] = [0];
  for (let i = 1; i <= N; i++) {
    out.push(out[i - 1] + feather((D_BASE - (i / N) * D_BASE) / STRIP_CELL, STRIP_FEATHER));
  }
  const tot = out[N];
  return out.map((v) => v / tot);
})();
const latSample = (u: number) => {
  const N = LAT_CDF.length - 1;
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (LAT_CDF[m] < u) lo = m;
    else hi = m;
  }
  return ((lo + (u - LAT_CDF[lo]) / Math.max(1e-9, LAT_CDF[hi] - LAT_CDF[lo])) / N) * D_BASE;
};

type Seat = { key: string; tau: number; d: number; r: number; wa: number; wb: number };

const STRIP_ALL: Seat[] = (() => {
  const t0 = tauAt(S_MIN + 10);
  const t1 = tauAt(S_MAX - 10);
  const n = Math.round((t1 - t0) / D_TAU);
  const out: Seat[] = [];
  for (let i = 0; i < n; i++) {
    const tau = t0 + (i + 0.5 + (hash(i, 11) - 0.5) * 0.85) * D_TAU;
    const s = S_OF(tau);
    const edge = 1 + (wobble(s, 2.3) * STRIP_WOBBLE) / D_BASE;
    const sgn = hash(i, 12) < 0.5 ? -1 : 1;
    const d = sgn * latSample(hash(i, 13)) * edge;
    const g = feather((D_BASE * edge - Math.abs(d)) / STRIP_CELL, STRIP_FEATHER);
    out.push({
      key: `p${i}`,
      tau,
      d,
      r: DOT_R * (0.8 + 0.4 * hash(i, 14)) * (0.75 + 0.25 * g),
      wa: hash(i, 15) * Math.PI * 2,
      wb: hash(i, 16) * Math.PI * 2,
    });
  }

  // Blue noise, relaxed in the UNSTRETCHED frame (tau * STREAM_V, d): the
  // ladder scales that frame by a nearly constant factor in every direction at
  // once — 2.55 along, 3.36 across, 2.84 in radius — so an arrangement that is
  // clear at the bottom is clear at the top, which the clump audit confirms.
  const conf = out.map((p) => ({ s: p.tau * STREAM_V, d: p.d, r: p.r }));
  const idx = conf.map((_, i) => i);
  for (let pass = 0; pass < SEP_PASSES; pass++) {
    idx.sort((a, b) => conf[a].s - conf[b].s);
    let moved = 0;
    for (let a = 0; a < idx.length; a++) {
      const i = idx[a];
      for (let b = a + 1; b < idx.length; b++) {
        const j = idx[b];
        const dsRaw = conf[j].s - conf[i].s;
        if (dsRaw > 220) break;
        const ds = dsRaw * S_METRIC;
        const dd = conf[j].d - conf[i].d;
        const dist = Math.hypot(ds, dd);
        const need = SEP_K * 0.5 * (conf[i].r + conf[j].r);
        if (dist >= need || dist < 1e-6) continue;
        const push = ((need - dist) / 2) * SEP_RELAX;
        conf[i].s -= (ds / dist / S_METRIC) * push;
        conf[i].d -= (dd / dist) * push;
        conf[j].s += (ds / dist / S_METRIC) * push;
        conf[j].d += (dd / dist) * push;
        moved++;
      }
    }
    if (moved === 0) break;
  }
  out.forEach((p, i) => {
    p.tau = conf[i].s / STREAM_V;
    p.d = Math.max(-D_BASE * 1.15, Math.min(D_BASE * 1.15, conf[i].d));
  });
  return out;
})();



/** A seat's arc position at frame f: the particle path, plus its own wander. */
export const seatS = (p: Seat, f: number) =>
  S_OF(p.tau + f) + WANDER_A * Math.sin((2 * Math.PI * f) / (WANDER_T0 + (WANDER_T1 - WANDER_T0) * hash(p.tau, 21)) + p.wa);

export const seatRaw = (p: Seat, f: number) => {
  const s = seatS(p, f);
  const wob =
    WANDER_A *
    Math.sin((2 * Math.PI * f) / (WANDER_T0 + (WANDER_T1 - WANDER_T0) * hash(p.tau, 22)) + p.wb);
  const dBase = p.d + wob;
  const d = dBase * lateralMul(s, dBase);
  const c = curveAt(s);
  return {
    x: c.x + -c.ty * d,
    y: c.y + c.tx * d,
    r: p.r * radiusMul(s),
    tone: 1,
    hd: Math.atan2(c.ty, c.tx),
    s,
  };
};

// ---------------------------------------------------------------------------
// THE POCKET. The person outline is drawn over ONE comet, and at 2.1x its
// radius it reaches about 5.5 comet-radii from that comet's centre. With the
// corridor at its ordinary density that circle holds four or five other comets,
// and the outline reads as an icon pasted on a crowd rather than as something
// being drawn on to one of them. So the seats that would be inside it during
// the ride are simply NOT SEATED — removed once, statically, at strip level.
// The pocket is part of the rigid strip, so it travels with the stream and is
// never an animated hole; it is an airy spot that happens to be where the
// camera goes. It is the smallest that keeps the outline clear: POCKET_K times
// the outline's own bounding radius, tested over the frames the outline exists.
// ---------------------------------------------------------------------------
/** The head circle, as a multiple of the comet's drawn radius. Hoisted here
 *  because the pocket is sized off the outline it has to make room for. */
export const OUTLINE_HEAD_MUL = 2.1;
const POCKET_K = 1.25;
const POCKET_F: [number, number] = [44, 100];
/** The outline's bounding radius, in multiples of the rider's drawn radius:
 *  the shoulders reach 13 Lucide units below the head's centre at an em of
 *  HEAD_MUL / LU_HEAD_R. */
const OUTLINE_REACH = (13 * OUTLINE_HEAD_MUL) / 5;

/** Which seat the camera rides, and which seats are cleared out around it. */
export const RIDER = (() => {
  const want = tauAt(TIERS[0].s) - 44;
  let best = 0;
  let score = Infinity;
  STRIP_ALL.forEach((p, i) => {
    const q = Math.abs(p.tau - want) * 3 + Math.abs(Math.abs(p.d) - 70);
    if (q < score) {
      score = q;
      best = i;
    }
  });
  return best;
})();

/** The rider's key in the drawn world, so the render can find it without
 *  depending on its index in the filtered strip. */
export const RIDER_KEY = `p${RIDER}`;

export const POCKET: number[] = (() => {
  const r = STRIP_ALL[RIDER];
  const drop: number[] = [];
  for (let i = 0; i < STRIP_ALL.length; i++) {
    if (i === RIDER) continue;
    let near = false;
    for (let f = POCKET_F[0]; f <= POCKET_F[1] && !near; f += 2) {
      const a = seatRaw(r, f);
      const b = seatRaw(STRIP_ALL[i], f);
      if (Math.hypot(a.x - b.x, a.y - b.y) < POCKET_K * OUTLINE_REACH * a.r) near = true;
    }
    if (near) drop.push(i);
  }
  return drop;
})();

export const STRIP: Seat[] = STRIP_ALL.filter((_, i) => !POCKET.includes(i));

// ---------------------------------------------------------------------------
// THE THREE SIGNS, 197 frames on. They broke away in cut 2 and they are still
// there, still ringed, low on the curve — deep-toned, drifter-length comets
// wandering about the spot they reached. Their drift is SATURATED (it was a
// decaying peel, not a launch), so they are within a few px of where cut 2 left
// them and they will never sail off; the wander is all that is left of it.
// ---------------------------------------------------------------------------
const SIGN_WANDER = 9;
const SIGN_T = [63, 77, 91];
export const SIGN_HOME = [0, 1, 2].map((j) => {
  const p = SBS_SIGN_PATH[j][SBS_DURATION - 1];
  const q = SBS_SIGN_PATH[j][SBS_DURATION - 2];
  // where it would settle if its remaining drift ran out: the saturation
  const vx = p.x - q.x;
  const vy = p.y - q.y;
  return { x: p.x + vx * 24, y: p.y + vy * 24, hd: p.hd, r: p.r };
});
const signPos = (j: number, f: number) => {
  const h = SIGN_HOME[j];
  const t = W0 - 110 + f;
  return {
    x: h.x + SIGN_WANDER * Math.sin((2 * Math.PI * t) / SIGN_T[j] + j * 2.1),
    y: h.y + SIGN_WANDER * Math.sin((2 * Math.PI * t) / (SIGN_T[j] * 1.37) + j * 3.7),
  };
};
const signAt = (j: number, f: number) => {
  const p = signPos(j, f);
  const q = signPos(j, f - 1);
  // a drifter's tail follows its ACTUAL velocity — cut 1's rule. These three
  // left the stream long ago; the wander is all the motion they have, so it is
  // the wander that points them.
  return {
    ...p,
    r: SIGN_HOME[j].r,
    tone: 0,
    hd: Math.atan2(p.y - q.y, p.x - q.x),
    s: 0,
  };
};

// ---------------------------------------------------------------------------
// THE BARS. Tick 1 was drawn in cut 2 and is simply there. Ticks 2 and 3 draw
// centre-out over ten frames as the camera brings them into frame, each scaled
// to the corridor it marks.
// ---------------------------------------------------------------------------
const TICK_HALF = 88; // cut 2's, at tier 1
const TICK_DRAW: [number, number][] = [
  [-1, -1],
  [94, 104],
  [112, 122],
];
export const tickHalf = (i: number) => TICK_HALF * Math.pow(1.45, i);
const tickU = (i: number, f: number) =>
  i === 0 ? 1 : smoothstep(clamp01((f - TICK_DRAW[i][0]) / (TICK_DRAW[i][1] - TICK_DRAW[i][0])));

// ---------------------------------------------------------------------------
// THE CAMERA. The set's construction — keyed per frame off `camEase`, cy from
// the eased k, both axes through the shared damper — with one addition: over
// the middle of the cut the pan's target is not an authored point but the
// CHOSEN COMET'S OWN ARC PATH, blended in and out. That is what makes the
// close-up a ride rather than a push: the comet holds at the content centre and
// the world goes past it.
// ---------------------------------------------------------------------------
const GT_LAST = SBS_CAM_AT(SBS_DURATION - 1);
const GT_PREV = SBS_CAM_AT(SBS_DURATION - 2);
export const K_IN = GT_LAST.k;
const C_IN = { x: GT_LAST.cx, y: GT_LAST.cy - CAM_LIFT / GT_LAST.k };
const D_IN = {
  k: GT_LAST.k - GT_PREV.k,
  x: GT_LAST.cx - GT_PREV.cx,
  y: GT_LAST.cy - CAM_LIFT / GT_LAST.k - (GT_PREV.cy - CAM_LIFT / GT_PREV.k),
};

const K_MID = 1.3;
const K_CLOSE = 2.05;
const F_MID = 44;
const F_CLOSE = 72;
const F_OUT = 124;
const TRACK_F1 = DURATION + 16;
const RIDE_IN: [number, number] = [40, 54];
const RIDE_OUT: [number, number] = [80, 98];
/** CAM_DAMP / CAM_STIFF: what the shared damper lags a constant-velocity
 *  target by, in frames of that target's own motion. */
const RIDE_LEAD = 0.468 / 0.09;

const riderAt = (f: number) => seatRaw(STRIP_ALL[RIDER], f);

type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };

const kTrack = (segs: KSeg[]) => {
  const K: number[] = new Array(TRACK_F1 + 1).fill(segs[0].k0);
  segs.forEach((s, i) => {
    if (i > 0 && segs[i - 1].f1 !== s.f0) throw new Error("camera: k segments must meet");
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++) {
      K[f] = s.k0 + (s.k1 - s.k0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    }
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) K[f] = s.k1;
  });
  return K;
};

const K_SEGS = (kEnd: number): KSeg[] => [
  { f0: 0, f1: 4, k0: K_IN, k1: K_IN + D_IN.k * 4, warp: 1.0 },
  { f0: 4, f1: F_MID, k0: K_IN + D_IN.k * 4, k1: K_MID, warp: 0.95 },
  { f0: F_MID, f1: F_CLOSE, k0: K_MID, k1: K_CLOSE, warp: 1.0 },
  { f0: F_CLOSE, f1: F_OUT, k0: K_CLOSE, k1: kEnd, warp: 0.85 },
  { f0: F_OUT, f1: TRACK_F1, k0: kEnd, k1: kEnd - 0.012, warp: 0.5 },
];

const dampX = (upto: number, F: number[], CXT: number[], K: number[]) =>
  runCamera(upto, F, CXT, K).cy;

/** The authored path the ride is blended over, and the ride itself. */
const panTrack = (fx: number, fy: number, K: number[]) => {
  const a = { x: C_IN.x + D_IN.x * 4, y: C_IN.y + D_IN.y * 4 };
  const mid = riderAt(66); // where the ride will be at its middle
  const F: number[] = [];
  const CXT: number[] = [];
  const CC: number[] = [];
  for (let f = 0; f <= TRACK_F1; f++) {
    let ax: number;
    let ay: number;
    if (f <= 4) {
      const g = camEase(f / 4, 1);
      ax = C_IN.x + D_IN.x * 4 * g;
      ay = C_IN.y + D_IN.y * 4 * g;
    } else if (f <= F_CLOSE) {
      const g = camEase((f - 4) / (F_CLOSE - 4), 0.95);
      ax = a.x + (mid.x - a.x) * g;
      ay = a.y + (mid.y - a.y) * g;
    } else if (f <= F_OUT) {
      const g = camEase((f - F_CLOSE) / (F_OUT - F_CLOSE), 0.95);
      ax = mid.x + (fx - mid.x) * g;
      ay = mid.y + (fy - mid.y) * g;
    } else {
      const g = camEase((f - F_OUT) / (TRACK_F1 - F_OUT), 0.5);
      ax = fx + 8 * g;
      ay = fy - 10 * g;
    }
    const w =
      smoothstep(clamp01((f - RIDE_IN[0]) / (RIDE_IN[1] - RIDE_IN[0]))) *
      (1 - smoothstep(clamp01((f - RIDE_OUT[0]) / (RIDE_OUT[1] - RIDE_OUT[0]))));
    // The damper lags a moving target by CAM_DAMP / CAM_STIFF times its speed,
    // so the ride is handed the rider's position PLUS that much of its velocity
    // and the comet sits where it is aimed instead of trailing behind it.
    const r = riderAt(f);
    const rn = riderAt(f + 1);
    const tx2 = r.x + (rn.x - r.x) * RIDE_LEAD;
    const ty2 = r.y + (rn.y - r.y) * RIDE_LEAD;
    F.push(f);
    CXT.push(ax + (tx2 - ax) * w);
    CC.push(ay + (ty2 - ay) * w);
  }
  return { F, CX: CXT, CY: CC.map((c, f) => c + CAM_LIFT / K[f]) };
};

const trackOf = (kEnd: number, fx: number, fy: number) => {
  const K = kTrack(K_SEGS(kEnd));
  const c = panTrack(fx, fy, K);
  return { F: c.F, K, CX: c.CX, CY: c.CY };
};

// ---------------------------------------------------------------------------
// THE RESOLVED FRAME. It has to hold the whole ladder — the bend at the bottom,
// three bars, and the widest corridor at the top — inside the caption-safe band.
// ---------------------------------------------------------------------------
const BAND = { x0: 110, x1: 970, y0: 200, y1: 1400 };
/** The resolved frame is THE LADDER, and nothing else has to be in it. The
 *  first build solved it around the three ringed signs as well; they sit 250 px
 *  off the line at the bottom of the arc, so the box they make is enormous and
 *  the ladder came out small (k 0.44), leaning left, with the right third of
 *  the frame empty. They are allowed to leave — the camera rises past them —
 *  and the frame is built on the arc from just below tick 1 to the top of tier
 *  3's stream instead.
 *
 *  Three things are solved rather than authored:
 *    k   the largest zoom at which the WIDEST corridor still fits the band
 *    cx  the mean x of the spine between tick 1 and the top, so the steep leg
 *        stands on the frame's vertical axis instead of leaning
 *    cy  anchored so TICK 3 lands on screen y TICK3_Y — the top of the ladder
 *        is what the last frame is about, so it is what the framing is hung on
 */
const S_SHOW_LO = 1450;
const S_SHOW_HI = 3700;
const TICK3_Y = 325;

const FRAMING = (() => {
  // cx: the spine's own mean between the first bar and the top
  let sx = 0;
  let n = 0;
  for (let s = TIERS[0].s; s <= 3500; s += 6) {
    sx += curveAt(s).x;
    n++;
  }
  const cx = sx / n;
  // k: the widest the corridor ever gets, against the band's width
  let half = 0;
  for (let s = S_SHOW_LO; s <= S_SHOW_HI; s += 6) {
    const c = curveAt(s);
    const w = D_BASE * lateralMul(s, D_BASE) + DOT_R * radiusMul(s);
    for (const sgn of [-1, 1]) {
      half = Math.max(half, Math.abs(c.x + -c.ty * sgn * w - cx));
    }
  }
  const k = Math.min(0.64, (BAND.x1 - BAND.x0) / 2 / half);
  // cy: hung on tick 3
  const cy = curveAt(TIERS[2].s).y + (960 - TICK3_Y) / k - CAM_LIFT / k;
  return { k, cx, cy };
})();

export const K_REST = FRAMING.k;
const F_SOLVE = 122;

export const K_END = (() => {
  const at = (kEnd: number) => {
    const t = trackOf(kEnd, FRAMING.cx, FRAMING.cy);
    return runCamera(F_SOLVE, t.F, t.CY, t.K).k;
  };
  const a = K_REST * 0.7;
  const b = K_REST * 1.1;
  return a + ((K_REST - at(a)) * (b - a)) / (at(b) - at(a));
})();

const CENTRE_END = (() => {
  const cyAt = (fy: number) => {
    const t = trackOf(K_END, FRAMING.cx, fy);
    const c = runCamera(F_SOLVE, t.F, t.CY, t.K);
    return c.cy - CAM_LIFT / c.k;
  };
  const a = FRAMING.cy - 400;
  const b = FRAMING.cy + 400;
  const fy = a + ((FRAMING.cy - cyAt(a)) * (b - a)) / (cyAt(b) - cyAt(a));
  const cxAt = (fx: number) => {
    const t = trackOf(K_END, fx, fy);
    return dampX(F_SOLVE, t.F, t.CX, t.K);
  };
  const p = FRAMING.cx - 400;
  const q = FRAMING.cx + 400;
  const fx = p + ((FRAMING.cx - cxAt(p)) * (q - p)) / (cxAt(q) - cxAt(p));
  return { fx, fy };
})();

export const CAM = trackOf(K_END, CENTRE_END.fx, CENTRE_END.fy);

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
export const CAM_AT = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const SCREEN_AT = (f: number, wx: number, wy: number) => {
  const c = CAM_AT(f);
  return [CX + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// V2 — THE COMET SHIFTS INTO A PERSON. On the user's note about the delivered
// cut, verbatim:
//
//   "instead of doing an outline of a person, which doesn't really make any
//    sense, it can shift into one of those shapes, but still keeping the tail
//    with the direction it has now."
//
// So the white outline is gone — no ink of ours touches a comet any more — and
// the ridden comet's own body changes shape instead: the dot becomes the house
// person silhouette (a round head over a shoulder dome with a small neck gap,
// flat and filled, as `public/person.png`), in the comet's own orange, and it
// changes back. Nothing else in the cut moves: the camera, the ride, the
// pocket, the ladder, the flow and every other comet are bit for bit what they
// were.
//
// It is ONE PARAMETRIC SHAPE, not a crossfade between two. Everything is a
// function of m, and at m = 0 every term collapses to the comet's own circle
// and tip, so the path string is character for character `cometPath`'s:
//
//   the SHOULDER circle IS the comet's dot, grown and eased back
//       rs = r * g * (1 + 0.55 m),   Cs = C0 - u * r * g * 0.70 m
//   the HEAD circle is also the dot, slid forward and barely tightened
//       rh = r * g * (1 - 0.04 m),   Ch = C0 + u * r * g * 2.0 m
//   with g = 1 + 0.45 m scaling the whole figure, so the head keeps about the
//   size the dot had while the shoulders grow out behind it. The head is 0.62
//   of the shoulder circle, which is `person.png`'s own proportion (head r 5,
//   shoulders r 8); the brief's 0.62 OF THE DOT would make it 0.40 of the
//   shoulders and the figure reads as a pawn rather than as a person.
//
// The tail is the same construction it always was — the two tangent lines from
// the tip back to the body circle — so it keeps its direction (the comet's
// heading), its taper and, because the tip is eased back by the same amount the
// shoulders eat into it, its VISIBLE length. It leaves from under the shoulders
// along the heading axis, which on the steep leg is a ~12 degree lean into the
// motion, because the whole figure is built on the heading and not on the
// screen.
//
// The neck gap is arithmetic, not a keyframe: the head's rear edge passes the
// shoulders' front edge at
//       2.04 m - 1 > 1 - 0.15 m   =>   m > 0.913
// so the gap is the LAST thing to open, a few frames before the hold.
//
// At f72 the figure is 90 screen px across the shoulders and 152 tall.
// ---------------------------------------------------------------------------
const M_F0 = 50; // the shift starts
const M_F1 = 68; // ...is complete
const M_BACK: [number, number] = [78, 94]; // ...and is taken back
const G_GROW = 0.45; // the whole figure's scale at m = 1
const SH_R = 0.55; // the shoulder circle's growth
const SH_BACK = 0.7; // ...and how far it eases back
const HD_R = 0.04; // the head circle's tightening
const HD_FWD = 2.0; // ...and how far it slides forward
const TIP_BACK = 1.6; // the tip eases back so the visible tail keeps its length

export const morphM = (f: number) =>
  smoothstep(clamp01((f - M_F0) / (M_F1 - M_F0))) *
  (1 - smoothstep(clamp01((f - M_BACK[0]) / (M_BACK[1] - M_BACK[0]))));

/** `cometPath`'s own construction with the body circle and the tip given
 *  separately, so the morph can move them. Called with the comet's own circle
 *  and tip it returns cometPath's string exactly. */
const bodyPath = (cx: number, cy: number, r: number, hd: number, L: number) => {
  if (r < 0.05 || L <= r * 1.05) return null;
  const ux = -Math.cos(hd);
  const uy = -Math.sin(hd);
  const nx = -uy;
  const ny = ux;
  const cp = r / L;
  const sp = Math.sqrt(1 - cp * cp);
  const n = (v: number) => v.toFixed(2);
  const p1x = cx + r * (cp * ux + sp * nx);
  const p1y = cy + r * (cp * uy + sp * ny);
  const p2x = cx + r * (cp * ux - sp * nx);
  const p2y = cy + r * (cp * uy - sp * ny);
  return (
    `M${n(p1x)} ${n(p1y)} A${n(r)} ${n(r)} 0 1 1 ${n(p2x)} ${n(p2y)} ` +
    `L${n(cx + ux * L)} ${n(cy + uy * L)} Z`
  );
};

/** The rider's body at frame f: one path at m = 0, two from the moment the head
 *  starts to separate. Both are filled with the comet's own colour and nothing
 *  else, so while they overlap they are one solid silhouette. */
export const riderShape = (d: Drawn, m: number) => {
  const L0 = 2 * d.r * (TIP_DRIFT + (TIP_STREAM - TIP_DRIFT) * d.tone);
  if (m <= 0) return { body: bodyPath(d.x, d.y, d.r, d.hd, L0), head: null as string | null };
  const g = 1 + G_GROW * m;
  const ux = Math.cos(d.hd);
  const uy = Math.sin(d.hd);
  const rs = d.r * g * (1 + SH_R * m);
  const csx = d.x - ux * d.r * g * SH_BACK * m;
  const csy = d.y - uy * d.r * g * SH_BACK * m;
  // the tip measured from the body circle, eased back by what the shoulders eat
  const L = L0 + d.r * g * (SH_BACK + TIP_BACK) * m;
  const rh = d.r * g * (1 - HD_R * m);
  const chx = d.x + ux * d.r * g * HD_FWD * m;
  const chy = d.y + uy * d.r * g * HD_FWD * m;
  return {
    body: bodyPath(csx, csy, rs, d.hd, L),
    head: `M${(chx + rh).toFixed(2)} ${chy.toFixed(2)} A${rh.toFixed(2)} ${rh.toFixed(
      2,
    )} 0 1 1 ${(chx - rh).toFixed(2)} ${chy.toFixed(2)} A${rh.toFixed(2)} ${rh.toFixed(
      2,
    )} 0 1 1 ${(chx + rh).toFixed(2)} ${chy.toFixed(2)} Z`,
  };
};

// ---------------------------------------------------------------------------

export const worldAt = (f: number): Drawn[] => {
  const out: Drawn[] = [];
  STRIP.forEach((p) => {
    const now = seatRaw(p, f);
    const was = seatRaw(p, f - 1);
    out.push({ ...now, key: p.key, vx: now.x - was.x, vy: now.y - was.y });
  });
  for (let j = 0; j < 3; j++) {
    const now = signAt(j, f);
    const was = signAt(j, f - 1);
    out.push({ ...now, key: `g${j}`, vx: now.x - was.x, vy: now.y - was.y });
  }
  return out;
};

const IncreasinglyCapable: React.FC<Props> = ({
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

  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const camX = dampX(frame, CAM.F, CAM.CX, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const world = worldAt(frame);
  const toRipe = makeTone(accentDeep, accent);
  const spine = spinePath(0, 3800);

  const m = morphM(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={W0 + frame}
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
            {world.map((d) => {
              if (d.key === RIDER_KEY && m > 0) {
                const sh = riderShape(d, m);
                const col = toRipe(d.tone);
                return (
                  <g key={d.key}>
                    {sh.body ? <path d={sh.body} fill={col} opacity={dotOpacity} /> : null}
                    {sh.head ? <path d={sh.head} fill={col} opacity={dotOpacity} /> : null}
                  </g>
                );
              }
              const p = cometPath(d);
              return p ? (
                <path key={d.key} d={p} fill={toRipe(d.tone)} opacity={dotOpacity} />
              ) : null;
            })}

            <g style={{ filter: icon }}>
              <path
                d={spine.d}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={SPINE_OPACITY}
              />

              {/* the ladder's three bars */}
              {TIERS.map((t, i) => {
                const uu = tickU(i, frame);
                if (uu <= 0) return null;
                const c = curveAt(t.s);
                const h = tickHalf(i) * uu;
                return (
                  <line
                    key={`t${i}`}
                    x1={c.x + c.ty * h}
                    y1={c.y - c.tx * h}
                    x2={c.x - c.ty * h}
                    y2={c.y + c.tx * h}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={SPINE_OPACITY}
                  />
                );
              })}

              {/* the three signs' rings, still on them */}
              {[0, 1, 2].map((j) => {
                const p = signAt(j, frame);
                return (
                  <circle
                    key={`r${j}`}
                    cx={p.x}
                    cy={p.y}
                    r={RING_R}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    opacity={SPINE_OPACITY}
                  />
                );
              })}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default IncreasinglyCapable;

export const STATS = {
  duration: DURATION,
  w0: W0,
  tiers: TIERS,
  tierGrow: TIER_GROW,
  latSpan: TIERS.map((_, i) => [i, Math.round(latSpan(i, D_BASE * (i === 0 ? 1 : i === 1 ? 1.6 : 2.32)))]),
  mulAt: [1700, 2000, 2400, 2700, 3000, 3300, 3700].map((s) => [
    s,
    Number(radiusMul(s).toFixed(2)),
    Number(lateralMul(s, D_BASE).toFixed(2)),
    Number(speedMul(s).toFixed(2)),
  ]),
  strip: STRIP.length,
  dTau: Number(D_TAU.toFixed(3)),
  rider: RIDER,
  riderS: [0, 32, 44, 56, 72, 94].map((f) => [f, Math.round(seatS(STRIP[RIDER], f))]),
  kIn: Number(K_IN.toFixed(4)),
  kMid: K_MID,
  kClose: K_CLOSE,
  kRest: Number(K_REST.toFixed(4)),
  kEnd: Number(K_END.toFixed(4)),
  kTrack: [0, 20, 32, 44, 56, 72, 94, 111, 129, 144, 159].map((f) => [
    f,
    Number(CAM_AT(f).k.toFixed(3)),
  ]),
  tickHalf: TIERS.map((_, i) => Math.round(tickHalf(i))),
  morphM: [50, 56, 61, 64, 68, 72, 78, 84, 90, 94].map((f) => [f, Number(morphM(f).toFixed(3))]),
};
