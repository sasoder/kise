import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  camMove,
  clamp01,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  CompanyCard,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
} from "./d1Shared";

// ---------------------------------------------------------------------------
// "500 mile hurricane" — Cheeky Pint style on kraft, opaque cutaway, 24fps,
// 1080x1920.
//
// THE LINE (Dan Sundheim, on the GameStop short squeeze):
//   "I didn't know there was a 500 mile hurricane that existed. I didn't know
//    that could happen."
//
// SRT span 7.540 -> 11.859. round((11.859 - 7.540) * 24) = round(4.319 * 24)
// = round(103.7) = 104 frames of speech, plus a 16-frame tail so the resolved
// peak holds = 120.
//
// WORD ONSETS (frames from the composition start, = 7.540s)
//   f0 I · f7 didn't · f11 know · f15 there · f20 was · f22 a · f24 500 ·
//   f33 mile · f38 hurricane (9.119 -> 10.000) · f59 that · f68 existed ·
//   f78 I · f79 didn't · f82 know · f84 that · f87 could · f90 happen ·
//   speech ends f104 · tail to f120.
//
// THE PICTURE. One price chart on the kraft: GameStop, Dec 1 2020 -> Jan 28
// 2021, drawn left to right. Flat for weeks, then vertical. The spike IS the
// hurricane. It stops at the peak — no crash, nothing after it.
//
// THE DATA (as reported in 2021, not split-adjusted; x = days since Dec 1).
// These sixteen points and nothing else: no fetching, no interpolation.
//   Dec 1  $15.80 (0)   Dec 15 $14.50 (14)  Dec 31 $18.84 (30)
//   Jan 4  $17.25 (34)  Jan 8  $17.69 (38)  Jan 12 $19.95 (42)
//   Jan 13 $31.40 (43)  Jan 14 $39.91 (44)  Jan 15 $35.50 (45)
//   Jan 19 $39.36 (49)  Jan 21 $43.03 (51)  Jan 22 $65.01 (52)
//   Jan 25 $76.79 (55)  Jan 26 $147.98 (56) Jan 27 $347.51 (57)
//   Jan 28 $483.00 (58) — the intraday high, and the end point.
//
// THE PHASES — one draw, one camera. Everything is one continuous arc-length
// track s(f) along that polyline, so the spike is an ACCELERATION of the calm
// draw and not a second gesture: the spike's opening speed is the calm's exit
// speed, solved rather than typed (SPIKE_M0 below).
//
//   1. CALM                                                      f0 -> f26
//      The head draws Dec 1 -> Jan 21 (days 0-51) on a flat-topped ease —
//      CALM_A of ramp, then one level speed — quick, level, unremarkable. The
//      tip dot leads in ink. `$17` fades in at f2 over 6 frames. The camera is
//      parked TIGHT on the flat stretch (k K_TIGHT, cx X_TIGHT, the line's
//      December level at the caption-safe centre): the $0 tick and the Dec
//      label are in frame, the $500 tick and the GameStop badge are above it.
//
//   2. THE HURRICANE                                            f26 -> f38
//      The same track keeps running: Jan 22 -> Jan 28, days 51-58, almost
//      vertical. One Hermite whose opening slope IS the calm's speed, so it
//      accelerates out of the flat without a restart, peaks on the Jan 26 ->
//      Jan 27 leg and decelerates into $483 at f38 — the frame the word
//      "hurricane" lands on — with PEAK_OVER px of settle past it (a zero-
//      sloped bump, the house way of writing back(0.75)). The tip dot turns
//      ACCENT the moment the Jan 22 point is passed (f27.4): the squeeze is
//      the only accent on the chart. The camera is BLOWN OPEN by it — one
//      continuous move, keys f24-f34, warp 0.72, k K_TIGHT -> K_WIDE while it
//      tilts up 432 world px to catch the line, landed by f40.
//
//   3. THE PEAK, HELD                                          f40 -> f120
//      `$483` pops in at f40 (6-frame scale-in 0.6 -> 1 on back(0.75) at the
//      peak, the half-step wash for 3 frames, then it holds). The tip dot
//      stays accent on the peak and strains STRAIN_AMP px against it. The
//      camera settles on `sway` alone. "I didn't know that could happen"
//      plays over the held peak. Nothing fades out.
//
// DEVIATIONS from the brief, and why (all three are forced by the brief's own
// rules — the speed cap, the content band and "the tip stays inside the frame
// every frame" — and are reported rather than hidden):
//
//   * THE OPENING k IS 1.24, NOT 2.2. At k 2.2 the frame is 491 world px
//     wide; the calm draw crosses 686 px of world x in 26 frames, so the head
//     leaves the frame at f17 and stays outside it until the pull-back starts
//     at f24, and the $0 tick / Dec label (x 100-150) can only be in frame at
//     the same time as the head for the first third of the draw. The speed cap
//     says the same thing from the other side: 707.8 arc px in 26 frames is
//     30.2 world px/frame at the flat top, which is 66 screen px/frame at
//     k 2.2 and 37 at k 1.24. K_TIGHT is the tightest k that holds the axis
//     labels (x 81) and the Jan 21 point (x 836) inside the 60/1020 band at
//     once. The SHOT the brief asked for survives intact: the flat stretch
//     fills the width, the $500 tick sits 233 px above the top of the frame
//     and the GameStop badge is out of view until the line forces the frame
//     open. And the "blown open" is bigger than the zoom alone — the camera
//     also tilts up 432 world px to catch the line, ~34 screen px/frame.
//   * THE CAMERA LANDS AT cx 562 / k 0.98, NOT cx 540 / k 1.00. The resolved
//     picture spans world x 81 (the "$500" label, right-aligned to x 138) to
//     x 1041 (the right edge of the 44 px "$483"), which is 960 px — exactly
//     the width of the 60/1020 band, with nothing left for a margin. k 0.98
//     buys 19 px of air, and cx 562 splits it evenly (screen x 69 … 1011).
//   * THE CAMERA PANS. `camMove`/`runCamera` only carry cy and k, so cx gets
//     its own key-per-frame track through the SAME damper (`runCamera` with an
//     inert k channel) and the kraft takes cx/cxRest, which `GridBackground`
//     already supports. Without it the tight opening cannot be centred on the
//     flat stretch and the resolved frame cannot be centred on the chart.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 120;

// -- type -------------------------------------------------------------------
// Söhne, vendored, three weights for three jobs, loaded at module scope so a
// font failure surfaces before a frame is drawn. Separate families rather than
// weights of one family: a browser asked for a weight it does not have will
// synthesise it instead of failing.
export const FONT_AXIS = "SohneBuchHU";
export const FONT_PRICE = "SohneKraftigHU";
export const FONT_TITLE = "SohneHalbfettHU";
loadFont({ family: FONT_AXIS, url: staticFile("Sohne-Buch.otf"), weight: "400" });
loadFont({ family: FONT_PRICE, url: staticFile("Sohne-Kraftig.otf"), weight: "500" });
loadFont({ family: FONT_TITLE, url: staticFile("Sohne-Halbfett.otf"), weight: "600" });

// -- the drawing surface ----------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1450;

// -- the chart's geometry, in world px --------------------------------------
export const X0 = 150; // day 0
export const X1 = 930; // day 58
export const DAY_MAX = 58;
export const Y0 = 1300; // $0
export const Y1 = 400; // $500
export const PRICE_MAX = 500;
export const dayX = (day: number) => X0 + (day / DAY_MAX) * (X1 - X0);
export const priceY = (price: number) => Y0 - (price / PRICE_MAX) * (Y0 - Y1);

export type Quote = { day: number; price: number };
export const GME: Quote[] = [
  { day: 0, price: 15.8 }, // Dec 1
  { day: 14, price: 14.5 }, // Dec 15
  { day: 30, price: 18.84 }, // Dec 31
  { day: 34, price: 17.25 }, // Jan 4
  { day: 38, price: 17.69 }, // Jan 8
  { day: 42, price: 19.95 }, // Jan 12
  { day: 43, price: 31.4 }, // Jan 13
  { day: 44, price: 39.91 }, // Jan 14
  { day: 45, price: 35.5 }, // Jan 15
  { day: 49, price: 39.36 }, // Jan 19
  { day: 51, price: 43.03 }, // Jan 21 — the last calm point
  { day: 52, price: 65.01 }, // Jan 22 — the squeeze starts; the tip goes accent
  { day: 55, price: 76.79 }, // Jan 25
  { day: 56, price: 147.98 }, // Jan 26
  { day: 57, price: 347.51 }, // Jan 27
  { day: 58, price: 483.0 }, // Jan 28 — the intraday high, the end point
];
export const CALM_LAST = 10; // index of Jan 21, where the calm draw stops
export const SQUEEZE_AT = 11; // index of Jan 22, where the tip turns accent

export const PTS = GME.map((q) => ({ x: dayX(q.day), y: priceY(q.price) }));
export const SEG_LEN = PTS.slice(1).map((p, i) => Math.hypot(p.x - PTS[i].x, p.y - PTS[i].y));
export const CUM: number[] = (() => {
  const c = [0];
  SEG_LEN.forEach((l) => c.push(c[c.length - 1] + l));
  return c;
})();
export const S_CALM = CUM[CALM_LAST]; // 707.8 px of chart drawn in the calm
export const S_TOTAL = CUM[CUM.length - 1]; // 1527.6 px to the peak
export const S_SPIKE = S_TOTAL - S_CALM; // 819.9 px of hurricane
export const S_SQUEEZE = CUM[SQUEEZE_AT]; // the arc at which the tip goes accent

// A point at arc length `s` along the polyline. Past the end it extends along
// the last segment's direction, which is what the settle bump asks for.
export const pointAt = (s: number) => {
  if (s <= 0) return { ...PTS[0] };
  for (let j = 0; j < SEG_LEN.length; j++) {
    if (s <= CUM[j + 1] || j === SEG_LEN.length - 1) {
      const t = (s - CUM[j]) / SEG_LEN[j];
      return {
        x: PTS[j].x + (PTS[j + 1].x - PTS[j].x) * t,
        y: PTS[j].y + (PTS[j + 1].y - PTS[j].y) * t,
      };
    }
  }
  return { ...PTS[PTS.length - 1] };
};

// The drawn part of the chart as a path: every whole vertex reached, then the
// partial segment out to the head.
export const pathTo = (s: number) => {
  const head = pointAt(s);
  const d = [`M ${PTS[0].x.toFixed(2)} ${PTS[0].y.toFixed(2)}`];
  for (let j = 1; j < PTS.length; j++) {
    if (CUM[j] <= s) d.push(`L ${PTS[j].x.toFixed(2)} ${PTS[j].y.toFixed(2)}`);
    else break;
  }
  d.push(`L ${head.x.toFixed(2)} ${head.y.toFixed(2)}`);
  return d.join(" ");
};

// -- the draw ---------------------------------------------------------------
export const F_CALM1 = 26; // Jan 21 (day 51) is reached
export const F_PEAK = 38; // $483 — the frame "hurricane" lands on
export const F_SETTLE1 = 44; // the settle past the peak is spent
export const F_LABEL = 40; // "$483" pops in

// The calm's speed profile: a smoothstep ramp over the first CALM_A of the
// window, then one flat speed to f26. Flat-topped, so the peak is only
// 1/(1 - CALM_A/2) = 1.11x the average and the hand-off to the spike is the
// steady speed rather than a decaying one.
export const CALM_A = 0.2;
export const calmFrac = (u: number) => {
  const x = clamp01(u);
  const area = 1 - CALM_A / 2;
  if (x < CALM_A) {
    const g = x / CALM_A;
    return (CALM_A * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  return (CALM_A / 2 + (x - CALM_A)) / area;
};
// Arc px per frame at f26-: what the spike has to start at to be one motion.
export const V_HANDOFF = S_CALM / (F_CALM1 * (1 - CALM_A / 2));

// The hurricane: a cubic Hermite on [0,1] with P(0)=0, P(1)=1, P'(1)=0 and
// P'(0) SOLVED so the spike leaves at exactly the calm's speed. It is monotone
// for any m0 in [0, 2) — P'(u) = (1-u)(m0 + (6-3m0)u) — and its speed peaks at
// u 0.45, which is the Jan 26 -> Jan 27 leg: the steepest part of the data is
// also the fastest part of the draw, without either being keyed.
export const SPIKE_M0 = (V_HANDOFF * (F_PEAK - F_CALM1)) / S_SPIKE;
export const spikeFrac = (u: number) => {
  const x = clamp01(u);
  const h01 = 3 * x * x - 2 * x * x * x;
  const h10 = x - 2 * x * x + x * x * x;
  return h01 + SPIKE_M0 * h10;
};

// The landing settle: a couple of px past the peak and back. Written as sin^2
// over f38-f44 — zero value AND zero slope at both ends — rather than as
// Easing.out(Easing.back(0.75)) hung off the end of the travel, which would
// put a velocity step at the join.
export const PEAK_OVER = 2.5;
// The held peak never goes dead still: the tip strains against it, downward
// only, so it can never draw past the high.
export const STRAIN_AMP = 2;
export const STRAIN_PERIOD = 33;

export const drawnLength = (f: number): number => {
  if (f <= 0) return 0;
  if (f <= F_CALM1) return S_CALM * calmFrac(f / F_CALM1);
  if (f <= F_PEAK) return S_CALM + S_SPIKE * spikeFrac((f - F_CALM1) / (F_PEAK - F_CALM1));
  if (f <= F_SETTLE1) {
    const s = Math.sin((Math.PI * (f - F_PEAK)) / (F_SETTLE1 - F_PEAK));
    return S_TOTAL + PEAK_OVER * s * s;
  }
  const t = f - F_SETTLE1;
  return S_TOTAL - STRAIN_AMP * 0.5 * (1 - Math.cos((2 * Math.PI * t) / STRAIN_PERIOD));
};

export const headAt = (f: number) => pointAt(drawnLength(f));
// The frame the Jan 22 point is passed, solved off the track rather than typed.
export const F_SQUEEZE = (() => {
  for (let f = F_CALM1; f <= F_PEAK; f += 0.05) if (drawnLength(f) >= S_SQUEEZE) return Number(f.toFixed(2));
  return F_PEAK;
})();
export const SQUEEZE_FADE = 3; // frames the tip takes to cross ink -> accent

// -- the camera -------------------------------------------------------------
// One move. It opens parked on the flat stretch and is blown open by the line:
// k falls K_TIGHT -> K_WIDE while the content centre climbs 432 world px to
// catch the peak, keys f24-f34 on warp 0.72 (the widening is mostly spent by
// f30, which is what keeps the rocketing head inside the frame), landed by f40.
//
// The two binding frames, both solved against the house 60/1020 x band:
//   k 1.24 c 1262 cx 475  the "$0" label at screen x 86, the Jan 21 point at
//                         987, the $500 tick 233 px above the frame
//   k 0.98 c 830  cx 562  the "$500" label at screen x 69, the "$483" label's
//                         right edge at 1011, the title row at y 355, the
//                         month labels at y 1340
export const K_TIGHT = 1.24;
export const C_TIGHT = 1262; // the line's December level, at the caption-safe centre
export const X_TIGHT = 446;
export const K_WIDE = 0.98;
export const C_WIDE = 830; // the whole chart, y 340 … 1320, framed
export const X_WIDE = 562;
export const CAM_F0 = 22;
export const CAM_F1 = 32;
export const CAM_WARP = 0.72;
export const CY_FINAL = C_WIDE + CAM_LIFT / K_WIDE;

const CAM_TRACK = (() => {
  const F: number[] = [0];
  const K: number[] = [K_TIGHT];
  const CY: number[] = [C_TIGHT + CAM_LIFT / K_TIGHT];
  F.push(CAM_F0 - 1);
  K.push(K[0]);
  CY.push(CY[0]);
  const m = camMove({
    f0: CAM_F0,
    f1: CAM_F1,
    k0: K_TIGHT,
    k1: K_WIDE,
    c0: C_TIGHT,
    c1: C_WIDE,
    warp: CAM_WARP,
  });
  m.F.forEach((f, i) => {
    F.push(f);
    K.push(m.K[i]);
    CY.push(m.CY[i]);
  });
  F.push(DURATION);
  K.push(K_WIDE);
  CY.push(CY_FINAL);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

// cx through the SAME damper: `runCamera` damps its middle channel against a
// key-per-frame target, so handing it the cx keys and an inert k channel gives
// the pan exactly the weight of the zoom. One key per frame inside the move,
// for the reason `camMove` documents.
const CAMX_TRACK = (() => {
  const F: number[] = [0, CAM_F0 - 1];
  const X: number[] = [X_TIGHT, X_TIGHT];
  const span = CAM_F1 - CAM_F0;
  for (let i = 0; i <= span; i++) {
    F.push(CAM_F0 + i);
    X.push(X_TIGHT + (X_WIDE - X_TIGHT) * camEase(i / span, CAM_WARP));
  }
  F.push(DURATION);
  X.push(X_WIDE);
  return { F, X, K: F.map(() => 1) };
})();
export const CAMX_F = CAMX_TRACK.F;
export const CAMX_X = CAMX_TRACK.X;
export const CAMX_K = CAMX_TRACK.K;
export const camAt = (f: number) => {
  const c = runCamera(f, CAM_F, CAM_CY, CAM_K);
  const x = runCamera(f, CAMX_F, CAMX_X, CAMX_K).cy;
  return { k: c.k, cy: c.cy, cx: x };
};

// -- the furniture ----------------------------------------------------------
export const AXIS_OP = 0.55;
export const AXIS_SIZE = 26;
export const AXIS_LABEL_X = 138; // labels right-aligned to here
export const TICK = 10; // tick length, out of the axis
export const STROKE = 2.5; // the one stroke weight in the piece
export const TIP_R = 5;
export const Y_TICKS = [0, 250, 500];
export const X_TICKS: { day: number; label: string }[] = [
  { day: 0, label: "Dec" },
  { day: 31, label: "Jan" },
];
export const TITLE_X = 150;
export const TITLE_Y = 340; // baseline
export const TITLE_SIZE = 40;
export const BADGE_X = 118; // the cart card, to the title's left
export const BADGE_Y = 327;
export const BADGE_SIZE = 56;
export const START_LABEL_X = 143; // "$17", right-aligned, above-left of Dec 1
export const START_LABEL_Y = 1251;
export const START_LABEL_SIZE = 30;
export const START_LABEL_OP = 0.85;
export const F_START_LABEL = 2;
export const START_LABEL_FADE = 6;
export const PEAK_LABEL_X = 940; // "$483", to the right of the Jan 28 point
export const PEAK_LABEL_Y = 446;
export const PEAK_LABEL_SIZE = 44;
export const PEAK_LABEL_GROW = 6;
export const PEAK_LABEL_FROM = 0.6;
export const HALF_STEP = "#FFD98A"; // the 3-frame wash on the label's arrival
export const HALF_STEP_HOLD = 3;
export const EASE_LAND = Easing.out(Easing.back(0.75));

// -- the beat table ---------------------------------------------------------
export const BEATS = {
  i: 0,
  didnt: 7,
  know: 11,
  there: 15,
  was: 20,
  a: 22,
  fiveHundred: 24, // the camera starts opening here; the line is still calm
  mile: 33,
  hurricane: 38, // the peak lands on this frame
  that: 59,
  existed: 68,
  iTwo: 78,
  didntTwo: 79,
  knowTwo: 82,
  thatTwo: 84,
  could: 87,
  happen: 90,
  end: 104,
} as const;

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
  ticker: z.string(),
  beats: z.object({
    i: z.number(), // "I"
    didnt: z.number(), // "didn't"
    know: z.number(), // "know"
    there: z.number(), // "there"
    was: z.number(), // "was"
    a: z.number(), // "a"
    fiveHundred: z.number(), // "500"      — the camera starts to open
    mile: z.number(), // "mile"
    hurricane: z.number(), // "hurricane"  — the line lands on $483
    that: z.number(), // "that"
    existed: z.number(), // "existed"
    iTwo: z.number(), // "I"
    didntTwo: z.number(), // "didn't"
    knowTwo: z.number(), // "know"
    thatTwo: z.number(), // "that"
    could: z.number(), // "could"
    happen: z.number(), // "happen"        — held on the peak
    end: z.number(), // speech ends; tail to 120
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  ticker: "GameStop (GME)",
  beats: BEATS,
});

const FiveHundredMileHurricane: React.FC<Props> = ({
  ink,
  accent,
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
  ticker,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the draw -------------------------------------------------------------
  const s = drawnLength(frame);
  const head = pointAt(s);
  const d = pathTo(s);
  // ink while calm, accent from the moment Jan 22 is passed — the squeeze is
  // the only accent on the chart. A 3-frame cross rather than a switch.
  const squeezeTone = makeTone(ink, accent);
  const squeeze = smoothstep((frame - F_SQUEEZE) / SQUEEZE_FADE);

  // -- the two price labels -------------------------------------------------
  const startOp =
    START_LABEL_OP * clamp01((frame - F_START_LABEL) / START_LABEL_FADE);
  const peakIn = clamp01((frame - F_LABEL) / PEAK_LABEL_GROW);
  const peakScale = PEAK_LABEL_FROM + (1 - PEAK_LABEL_FROM) * EASE_LAND(peakIn);
  const peakFill =
    frame >= F_LABEL && frame < F_LABEL + HALF_STEP_HOLD ? HALF_STEP : accent;

  // -- camera ---------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx: wx, ty: wy } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={X_TIGHT}
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
            transform: `translate(${wx}px, ${wy}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the axes: two rules, five ticks, four labels, no grid, no box */}
            <g style={{ filter: icon }}>
              <line
                x1={X0}
                y1={Y0}
                x2={X0}
                y2={Y1}
                stroke={ink}
                strokeOpacity={AXIS_OP}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
              <line
                x1={X0}
                y1={Y0}
                x2={X1}
                y2={Y0}
                stroke={ink}
                strokeOpacity={AXIS_OP}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
              {Y_TICKS.map((p) => (
                <line
                  key={`yt${p}`}
                  x1={X0}
                  y1={priceY(p)}
                  x2={X0 - TICK}
                  y2={priceY(p)}
                  stroke={ink}
                  strokeOpacity={AXIS_OP}
                  strokeWidth={STROKE}
                  strokeLinecap="butt"
                />
              ))}
              {X_TICKS.map((t) => (
                <line
                  key={`xt${t.day}`}
                  x1={dayX(t.day)}
                  y1={Y0}
                  x2={dayX(t.day)}
                  y2={Y0 + TICK}
                  stroke={ink}
                  strokeOpacity={AXIS_OP}
                  strokeWidth={STROKE}
                  strokeLinecap="butt"
                />
              ))}
            </g>

            {/* the axis labels */}
            <g
              style={{ filter: icon }}
              fill={ink}
              fillOpacity={AXIS_OP}
              fontFamily={FONT_AXIS}
              fontSize={AXIS_SIZE}
            >
              {Y_TICKS.map((p) => (
                <text
                  key={`yl${p}`}
                  x={AXIS_LABEL_X}
                  y={priceY(p) + AXIS_SIZE * 0.34}
                  textAnchor="end"
                >
                  {`$${p}`}
                </text>
              ))}
              {X_TICKS.map((t) => (
                <text
                  key={`xl${t.day}`}
                  x={dayX(t.day)}
                  y={Y0 + TICK + AXIS_SIZE + 6}
                  textAnchor="middle"
                >
                  {t.label}
                </text>
              ))}
            </g>

            {/* the price: one line, one weight, straight segments, drawn
                head-led left to right and stopped at the peak */}
            <g style={{ filter: icon }}>
              <path
                d={d}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinejoin="miter"
                strokeLinecap="butt"
              />
              <circle cx={head.x} cy={head.y} r={TIP_R} fill={squeezeTone(squeeze)} />
            </g>

            {/* the start price, above-left of the Dec 1 point */}
            <text
              x={START_LABEL_X}
              y={START_LABEL_Y}
              textAnchor="end"
              fill={ink}
              fillOpacity={startOp}
              fontFamily={FONT_PRICE}
              fontSize={START_LABEL_SIZE}
              style={{ filter: icon }}
            >
              $17
            </text>

            {/* the peak, right of the Jan 28 point: the only other accent */}
            {frame >= F_LABEL ? (
              <g
                transform={`translate(${PEAK_LABEL_X} ${PEAK_LABEL_Y}) scale(${peakScale.toFixed(4)})`}
                style={{ filter: icon }}
              >
                <text fill={peakFill} fontFamily={FONT_TITLE} fontSize={PEAK_LABEL_SIZE}>
                  $483
                </text>
              </g>
            ) : null}

            {/* the chart's badge: the cart card and the name, above the chart */}
            <CompanyCard
              x={BADGE_X}
              y={BADGE_Y}
              sector="SHOPPING_CART"
              size={BADGE_SIZE}
              k={k}
              opacity={1}
              contact={false}
            />
            <text
              x={TITLE_X}
              y={TITLE_Y}
              fill={ink}
              fontFamily={FONT_TITLE}
              fontSize={TITLE_SIZE}
              style={{ filter: icon }}
            >
              {ticker}
            </text>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default FiveHundredMileHurricane;

// The two joins the whole cut rests on, asserted so a change to the window or
// the ease cannot quietly turn one motion into two.
if (Math.abs(drawnLength(F_PEAK) - S_TOTAL) > 0.01) {
  throw new Error(
    `FiveHundredMileHurricane: the head is at ${drawnLength(F_PEAK).toFixed(2)} on f${F_PEAK}, not the peak (${S_TOTAL.toFixed(2)})`,
  );
}
if (Math.abs(BEATS.hurricane - F_PEAK) > 0) {
  throw new Error(`FiveHundredMileHurricane: the peak is on f${F_PEAK}, not on "hurricane" (f${BEATS.hurricane})`);
}
