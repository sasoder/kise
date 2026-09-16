import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
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
  OP_READ,
  OP_UNREAD,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  iconShadow,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Ajeya Cotra: "Something like deciding how the AI, the assistants should
// behave, or what it means to be helpful, or what's like the objective when
// we're doing RL from human feedback."
//
// The composition starts at SRT 6.16 s, so a word at SRT time t lands on frame
// round((t - 6.16) * 24):
//   something  6.16 -> 0      or         9.54 -> 81
//   deciding   6.62 -> 11     means     10.26 -> 98
//   how        7.06 -> 22     helpful   11.14 -> 120
//   the AI     8.02 -> 45     or        11.44 -> 127
//   assistants 8.68 -> 60     objective 12.30 -> 147
//   should     8.98 -> 68     doing     13.12 -> 167
//   behave     9.22 -> 73     RL        13.36 -> 173
//                             human     13.86 -> 185
//                             feedback  14.06 -> 190
//   the next word, "then", is at 14.72 -> 205.
// DURATION = 205 + 16 tail = 221 frames.
//
// THE CLIP'S RULE: orange draws the target, white climbs it. The objective is
// an orange curve a human decision draws; everything the model does is white
// mass moving toward it. Orange is never decorative.
//
// Orange Dwarkesh style with the grid background: 1080x1920, 24fps, opaque,
// one stroke weight (9 px at k=1), one global shadow plus iconShadow(k) on
// every drawn element, white ink at OP_UNREAD / OP_READ, ACCENT for the live
// objective and ACCENT_DEEP only as the ghost of the superseded peak.
//
// GESTURES — one per word, nothing else:
//   1. f0-f10    "something"           the white baseline draws left -> right,
//                                      eased, then holds with the breathe.
//   2. f11-f70   "deciding ... behave" the orange reward curve is drawn as ONE
//                                      continuous stroke, pen slowest over the
//                                      peak (the peak passes under the pen at
//                                      f55), completing f70, three frames
//                                      ahead of "behave" f73. The camera pans
//                                      with the pen on its own damped keyed
//                                      track (follow 0.38, ramping in f11-f26
//                                      and out f54-f68) and is centred on the
//                                      whole curve by f68. Hold f73-f95.
//   3. f98-f116  "means ... helpful"   the peak is REDRAWN: the old peak stays
//                                      behind as a ghost — the live line hands
//                                      off to a copy of itself at f98, which
//                                      decays through ACCENT_DEEP to nothing by
//                                      f130, so nothing pops and nothing kinks
//                                      while a new stroke retraces from the
//                                      left shoulder (u 0.35) over a higher,
//                                      right-shifted peak (screen y 600,
//                                      u 0.66) down to the right foot, landing
//                                      4 frames before "helpful" f120.
//                                      Hold f120-f126.
//   4. f132-f143 "objective" (f147)    the only zoom: camera creep-in toward
//                                      the peak, k 1.00 -> 1.10, landing 4
//                                      frames ahead of the word, then held.
//   5. f167-f175 "doing"               seven white sample dots fade up on the
//                                      baseline at the left foot, hashed x
//                                      across the first 25% of the span.
//      f173-f199 "RL"                  each dot climbs the gradient in
//                                      discrete steps (period 6-8 frames,
//                                      hashed phase, a 5-frame eased hop that
//                                      lands ON the curve). The front dot
//                                      reaches the peak at f199; the others
//                                      trail on the slope.
//   6. f188-f198 "feedback" (f190)     the curve reacts under the climbers:
//                                      one lift of the peak, 4% of its height.
//                                      The dots are sampled from the curve, so
//                                      they ride it. Nothing else changes.
//   7. f205-f221 tail                  hold: the front dot sits at the peak,
//                                      the curve breathes, the camera is still.
//
// Deviation from the brief, and why: the brief asked for the peak to pass
// under the pen at f58-f62. The right fall is 289 px of x and 370 px of height
// (~470 px of arc); leaving it 8-12 frames puts the pen over 60 screen px per
// frame, which strobes. The peak passes at f55 instead, which leaves the fall
// 15 frames and a peak pen speed of ~44 px/frame, and still lands the slow
// part of the stroke five frames ahead of "assistants" (f60).
// ---------------------------------------------------------------------------

export const DURATION = 221;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // the objective: the line a human decision draws
  accentDeep: z.string(), // the ghost of the superseded peak, and nothing else
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
  strokeWidth: z.number(), // one weight for the whole piece
  dotRadius: z.number(), // screen px; divided by k at draw time
  beats: z.object({
    something: z.number(), // "something"
    deciding: z.number(), // "deciding"
    how: z.number(), // "how"
    theAi: z.number(), // "the AI"
    assistants: z.number(), // "assistants"
    should: z.number(), // "should"
    behave: z.number(), // "behave"
    orOne: z.number(), // "or"
    means: z.number(), // "what it means"
    helpful: z.number(), // "helpful"
    orTwo: z.number(), // "or"
    objective: z.number(), // "the objective"
    doing: z.number(), // "we're doing"
    rl: z.number(), // "RL"
    human: z.number(), // "human"
    feedback: z.number(), // "feedback"
    end: z.number(), // speech ends; tail to 221
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
  strokeWidth: 9,
  dotRadius: 15,
  beats: {
    something: 0,
    deciding: 11,
    how: 22,
    theAi: 45,
    assistants: 60,
    should: 68,
    behave: 73,
    orOne: 81,
    means: 98,
    helpful: 120,
    orTwo: 127,
    objective: 147,
    doing: 167,
    rl: 173,
    human: 185,
    feedback: 190,
    end: 205,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// THE CURVE. A skewed hill over a baseline, built from a function so the peak
// can be re-shaped and the climbers can sample its height and its gradient.
//
// The shape is a normalised beta bump u^a (1-u)^b, whose peak sits at
// a / (a + b) by construction — 3.1 / 1.9 puts it at u = 0.62 with a gentle
// left shoulder and a steeper right fall, and 3.3 / 1.7 puts the redrawn peak
// at u = 0.66. Both have zero slope at the feet, so the curve leaves and meets
// the baseline cleanly and there is no corner anywhere for the pen to hit.
//
// The world: the baseline runs 760 px, centred on world x 540, at world y 175
// — which is screen y 1010 at the opening camera (world y 0 sits at screen
// 835, the style's content centre). The first peak is 370 px above it (screen
// 640), the redrawn peak 410 px (screen 600).
// ---------------------------------------------------------------------------
const SPAN = 760;
const X_LEFT = 540 - SPAN / 2;
const BASE_Y = 175;
const H_ONE = 370;
const H_TWO = 410;

const betaMax = (a: number, b: number) =>
  Math.pow(a / (a + b), a) * Math.pow(b / (a + b), b);
const A1 = 3.1;
const B1 = 1.9;
const A2 = 3.3;
const B2 = 1.7;
const M1 = betaMax(A1, B1);
const M2 = betaMax(A2, B2);

const bump = (u: number, a: number, b: number, m: number) =>
  u <= 0 || u >= 1 ? 0 : (Math.pow(u, a) * Math.pow(1 - u, b)) / m;

// The objective as first drawn.
const hOld = (u: number) => H_ONE * bump(u, A1, B1, M1);
// The objective after the redraw. The two shapes are blended over u 0.35-0.55
// so the retrace starts EXACTLY on the old line at the left shoulder and there
// is no step where the new stroke picks it up.
const REDRAW_U0 = 0.35;
const hNew = (u: number) => {
  const w = smoothstep((u - REDRAW_U0) / 0.2);
  return hOld(u) + (H_TWO * bump(u, A2, B2, M2) - hOld(u)) * w;
};

// The redrawn peak, found on the blended shape rather than assumed.
const U_PEAK_NEW = (() => {
  let best = 0.5;
  let bv = -1;
  for (let i = 1; i < 1000; i++) {
    const u = i / 1000;
    const v = hNew(u);
    if (v > bv) {
      bv = v;
      best = u;
    }
  }
  return best;
})();
const H_MAX_NEW = hNew(U_PEAK_NEW);

const xOf = (u: number) => X_LEFT + u * SPAN;

// ---------------------------------------------------------------------------
// The pen. Its position is authored in ARC LENGTH, not in u: a pen keyed in u
// runs at wildly different screen speeds over a shoulder and a fall, and the
// fall is where it would strobe. `arcTable` samples the curve once at module
// scope; `uAtArc` inverts it.
// ---------------------------------------------------------------------------
const ARC_N = 1200;
const arcTable = (h: (u: number) => number, u0: number, u1: number) => {
  const S: number[] = [0];
  let acc = 0;
  let px = xOf(u0);
  let py = BASE_Y - h(u0);
  for (let i = 1; i <= ARC_N; i++) {
    const u = u0 + ((u1 - u0) * i) / ARC_N;
    const x = xOf(u);
    const y = BASE_Y - h(u);
    acc += Math.hypot(x - px, y - py);
    px = x;
    py = y;
    S.push(acc);
  }
  return { S, u0, u1, total: acc };
};

type Arc = ReturnType<typeof arcTable>;

const uAtArc = (t: Arc, s: number) => {
  if (s <= 0) return t.u0;
  if (s >= t.total) return t.u1;
  let lo = 0;
  let hi = ARC_N;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (t.S[m] < s) lo = m + 1;
    else hi = m;
  }
  const i = Math.max(1, lo);
  const a = t.S[i - 1];
  const b = t.S[i];
  const f = b > a ? (s - a) / (b - a) : 0;
  return t.u0 + ((t.u1 - t.u0) * (i - 1 + f)) / ARC_N;
};

// A cubic Hermite from 0 to 1 with authored end slopes, so two segments of a
// pen move can be joined without a step in speed.
const hermite = (x: number, m0: number, m1: number) => {
  const c = clamp01(x);
  const c2 = c * c;
  const c3 = c2 * c;
  return (c3 - 2 * c2 + c) * m0 + (-2 * c3 + 3 * c2) + (c3 - c2) * m1;
};

const ARC_ONE = arcTable(hOld, 0, 1);
const U_PEAK_OLD = A1 / (A1 + B1);
const S_PEAK_ONE = ARC_ONE.S[Math.round(U_PEAK_OLD * ARC_N)];

// Gesture 2: f11 -> f70, the peak under the pen at f55.
const PEN1_F0 = 11;
const PEN1_F1 = 70;
const PEN1_TPEAK = (55 - PEN1_F0) / (PEN1_F1 - PEN1_F0);

const penOne = (frame: number) => {
  const p = clamp01((frame - PEN1_F0) / (PEN1_F1 - PEN1_F0));
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  if (p <= PEN1_TPEAK) {
    // the long shoulder: in gently, and slowest of all arriving at the peak
    return uAtArc(ARC_ONE, S_PEAK_ONE * hermite(p / PEN1_TPEAK, 0.45, 0.28));
  }
  // the fall: released from the peak, decelerating into the right foot
  const x = (p - PEN1_TPEAK) / (1 - PEN1_TPEAK);
  return uAtArc(ARC_ONE, S_PEAK_ONE + (ARC_ONE.total - S_PEAK_ONE) * hermite(x, 0.14, 0.3));
};

// Gesture 3: f98 -> f116, the retrace over the new peak. The same shape of
// easing, milder — 18 frames for two thirds of the curve is a correction
// stroke, and a hard dip at the peak would turn the fall into a snap.
const ARC_TWO = arcTable(hNew, REDRAW_U0, 1);
const S_PEAK_TWO = ARC_TWO.S[Math.round(((U_PEAK_NEW - REDRAW_U0) / (1 - REDRAW_U0)) * ARC_N)];
const PEN2_F0 = 98;
const PEN2_F1 = 116;
const PEN2_TPEAK = clamp01((S_PEAK_TWO / ARC_TWO.total) * 1.18);

const penTwo = (frame: number) => {
  const p = clamp01((frame - PEN2_F0) / (PEN2_F1 - PEN2_F0));
  if (p <= 0) return REDRAW_U0;
  if (p >= 1) return 1;
  if (p <= PEN2_TPEAK) {
    return uAtArc(ARC_TWO, S_PEAK_TWO * hermite(p / PEN2_TPEAK, 0.6, 0.45));
  }
  const x = (p - PEN2_TPEAK) / (1 - PEN2_TPEAK);
  return uAtArc(ARC_TWO, S_PEAK_TWO + (ARC_TWO.total - S_PEAK_TWO) * hermite(x, 0.45, 0.55));
};

// ---------------------------------------------------------------------------
// THE CAMERA. Two damped tracks off the shared helpers: a keyed pan that
// follows the pen's x at 0.38 with the follow itself ramped in and out (so the
// camera is never chasing the pen frame by frame — it leans after it and
// returns), and ONE zoom, the creep-in toward the peak on "objective".
// ---------------------------------------------------------------------------
const CX_REST = 540;
const ZOOM_F0 = 132;
const ZOOM_F1 = 143;
const K_FINAL = 1.1;
const C_FINAL = -60;
const ZOOM = camMove({
  f0: ZOOM_F0,
  f1: ZOOM_F1,
  k0: 1,
  k1: K_FINAL,
  c0: 0,
  c1: C_FINAL,
  warp: 0.8,
});
const CAM_F = [0, ...ZOOM.F, DURATION];
const CAM_K = [1, ...ZOOM.K, K_FINAL];
const CAM_CY = [CAM_LIFT, ...ZOOM.CY, C_FINAL + CAM_LIFT / K_FINAL];

const FOLLOW = 0.38;
const CX_F: number[] = [];
const CX_T: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const inRamp = smoothstep((f - PEN1_F0) / 15); // f11 -> f26
  const outRamp = 1 - smoothstep((f - 54) / 14); // f54 -> f68
  const follow = FOLLOW * Math.min(inRamp, outRamp);
  // the creep toward the peak rides the same frames as the zoom
  const creep = interpolate(f, [ZOOM_F0, ZOOM_F1], [0, 40], clamp);
  CX_F.push(f);
  CX_T.push(CX_REST + follow * (xOf(penOne(f)) - CX_REST) + creep);
}

// ---------------------------------------------------------------------------
// THE CLIMBERS. Seven white sample dots. They fade up on the baseline across
// the first 25% of the span and then climb the gradient in DISCRETE steps: a
// dot only moves when its own step fires, and a step is a short eased hop that
// lands on the curve. Period, phase and step count are per-dot and mutually
// prime enough that no two ever fire together; dot 6 is the front one and is
// keyed to reach the peak at f199.
// ---------------------------------------------------------------------------
const N_DOTS = 7;
const CLIMB_FADE = 167;
const CLIMB_START = 173;
const HOP = 5;
const DOT_U0 = [0.028, 0.063, 0.098, 0.134, 0.168, 0.203, 0.238];
const DOT_PERIOD = [8, 7, 6, 8, 6, 7, 7];
const DOT_PHASE = [4, 1, 5, 2, 0, 3, 0];
// How far up the slope each dot gets, and in how many steps. Only the front
// dot (6) reaches the peak; the rest run out of steps spread along the slope,
// so the tail holds them apart instead of stacking them all on the summit.
// Each dot's step count is whatever its own period and phase fit before f203,
// so a dot never stops mid-hop into the tail.
const DOT_TARGET = [0.5, 0.57, 0.535, 0.61, 0.59, 0.635, -1]; // -1 = the peak
const DOT_STEPS = [4, 5, 5, 4, 6, 4, 4];

const dotState = (i: number, frame: number) => {
  const u0 = DOT_U0[i];
  const target = DOT_TARGET[i] < 0 ? U_PEAK_NEW : DOT_TARGET[i];
  const du = (target - u0) / DOT_STEPS[i];
  const first = CLIMB_START + DOT_PHASE[i];
  if (frame < first) return { u: u0, onCurve: 0, hop: 0 };
  const n = Math.min(DOT_STEPS[i], Math.floor((frame - first) / DOT_PERIOD[i]) + 1);
  const fired = first + (n - 1) * DOT_PERIOD[i];
  const e = smoothstep((frame - fired + 1) / HOP);
  const uPrev = u0 + du * (n - 1);
  const u = uPrev + du * e;
  // the first hop is also what lifts a dot off the baseline onto the curve
  const onCurve = n > 1 ? 1 : e;
  return { u, onCurve, hop: e < 1 ? Math.sin(Math.PI * e) : 0 };
};

// ---------------------------------------------------------------------------

const HowAssistantsShouldBehave: React.FC<Props> = ({
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
  strokeWidth,
  dotRadius,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the curve, as it stands this frame ------------------------------------
  // Gesture 6: the peak lifts 4% under the climbers, weighted by the curve's
  // own height so the feet do not move. Everything that draws the curve, and
  // every climber, reads it through this one function, so they cannot drift.
  const lift = interpolate(frame, [beats.human + 3, beats.feedback + 8], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const breathe = 1 + 0.008 * Math.sin(frame * 0.09);
  const heightAt = (u: number, shape: (v: number) => number) =>
    shape(u) * (1 + 0.04 * lift * (hNew(u) / H_MAX_NEW)) * breathe;
  const yAt = (u: number, shape: (v: number) => number) => BASE_Y - heightAt(u, shape);

  const pathOf = (
    shape: (u: number) => number,
    u0: number,
    u1: number,
    lead: "M" | "L" = "M",
  ) => {
    const n = 220;
    const parts: string[] = [];
    for (let i = 0; i <= n; i++) {
      const u = u0 + ((u1 - u0) * i) / n;
      parts.push(`${i === 0 ? lead : "L"}${xOf(u).toFixed(2)} ${yAt(u, shape).toFixed(2)}`);
    }
    return parts.join(" ");
  };

  // -- gesture 1: the baseline ----------------------------------------------
  const baseDraw = interpolate(frame, [beats.something, beats.something + 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // -- gestures 2 and 3: the objective --------------------------------------
  const pen1 = penOne(frame);
  const redrawing = frame >= PEN2_F0;
  const pen2 = penTwo(frame);

  let curvePath: string | null = null;
  if (frame >= PEN1_F0 && pen1 > 0.002) {
    if (!redrawing) {
      curvePath = pathOf(hOld, 0, pen1);
    } else {
      // The live line is everything behind the pen: the old shoulder up to the
      // retrace point, then the new shape. What is AHEAD of the pen is not
      // live any more — it is the ghost below, which is the whole gesture.
      curvePath = `${pathOf(hOld, 0, REDRAW_U0)} ${pathOf(hNew, REDRAW_U0, pen2, "L")}`;
    }
  }

  // The superseded objective, left behind from the frame the retrace starts.
  // It is drawn twice over the same path: once still in ACCENT, so that at f98
  // the picture is EXACTLY the line that was standing there and nothing pops,
  // and once in ACCENT_DEEP underneath, which is what it decays through on its
  // way out. Both are gone by f130.
  const ghostDeepOp = redrawing
    ? interpolate(frame, [beats.means, beats.means + 32], [1, 0], clamp)
    : 0;
  const ghostLiveOp = redrawing
    ? interpolate(frame, [beats.means, beats.means + 16], [1, 0], clamp)
    : 0;

  // -- gesture 5: the climbers ----------------------------------------------
  const dotFade = interpolate(frame, [CLIMB_FADE, CLIMB_FADE + 8], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // -- the camera ------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const panned = runCamera(frame, CX_F, CX_T, CX_T);
  const drift = sway(frame);
  const k = cam.k;
  const cy = cam.cy + drift.dy;
  const cx = panned.cy + drift.dx;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  const rDot = dotRadius / k;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CX_REST}
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
            {/* gesture 1: the white baseline the objective is measured from */}
            {baseDraw > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={X_LEFT}
                  y1={BASE_Y}
                  x2={X_LEFT + SPAN * baseDraw}
                  y2={BASE_Y}
                  stroke={ink}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={OP_UNREAD}
                />
              </g>
            ) : null}

            {/* gesture 3: the superseded peak, left behind as it fades */}
            {ghostDeepOp > 0.003 ? (
              <g style={{ filter: icon }}>
                <path
                  d={pathOf(hOld, REDRAW_U0, 1)}
                  fill="none"
                  stroke={accentDeep}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={ghostDeepOp}
                />
                {ghostLiveOp > 0.003 ? (
                  <path
                    d={pathOf(hOld, REDRAW_U0, 1)}
                    fill="none"
                    stroke={accent}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={ghostLiveOp}
                  />
                ) : null}
              </g>
            ) : null}

            {/* gestures 2, 3 and 6: the objective */}
            {curvePath ? (
              <g style={{ filter: icon }}>
                <path
                  d={curvePath}
                  fill="none"
                  stroke={accent}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : null}

            {/* gesture 5: the climbers, sampled from the curve */}
            {dotFade > 0.003 ? (
              <g style={{ filter: icon }}>
                {Array.from({ length: N_DOTS }, (_, i) => {
                  const s = dotState(i, frame);
                  const yCurve = yAt(s.u, hNew);
                  const y = BASE_Y + (yCurve - BASE_Y) * s.onCurve - 10 * s.hop;
                  return (
                    <circle
                      key={i}
                      cx={xOf(s.u)}
                      cy={y}
                      r={rDot * breath(frame, i * 0.37)}
                      fill={ink}
                      opacity={OP_READ * dotFade}
                    />
                  );
                })}
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HowAssistantsShouldBehave;
