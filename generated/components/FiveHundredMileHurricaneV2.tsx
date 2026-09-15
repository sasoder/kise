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
// "500 mile hurricane" — V2. Cheeky Pint style on kraft, opaque cutaway, 24fps,
// 1080x1920.
//
// THE LINE (Dan Sundheim, on the GameStop short squeeze):
//   "I didn't know there was a 500 mile hurricane that existed. I didn't know
//    that could happen."
//
// SRT span 7.540 -> 11.859. round((11.859 - 7.540) * 24) = round(4.319 * 24)
// = round(103.7) = 104 frames of speech, plus a 16-frame tail so the resolved
// peak holds = 120. SAME duration as V1.
//
// WORD ONSETS (frames from the composition start, = 7.540s) — unchanged
//   f0 I · f7 didn't · f11 know · f15 there · f20 was · f22 a · f24 500 ·
//   f33 mile · f38 hurricane (9.119 -> 10.000) · f59 that · f68 existed ·
//   f78 I · f79 didn't · f82 know · f84 that · f87 could · f90 happen ·
//   speech ends f104 · tail to f120.
//
// ---------------------------------------------------------------------------
// WHAT CHANGED FROM V1 — exactly two things. Nothing else moved: same data,
// same labels, same fonts, same colours, same depth, same vignette, the same
// accent tip from Jan 22, no ground line, no shakes.
//
//   1. MORE PADDING. V1's resolved picture filled the house 60/1020 x band
//      edge to edge; the user read it as ink crowding the frame. V2 holds
//      EVERY piece of ink — the "$500"/"$250"/"$0" labels, "Dec"/"Jan", the
//      "GameStop (GME)" title and its cart badge, "$17", the "$483" callout,
//      the price line and both axis rules — inside
//
//          x 120 … 960   y 300 … 1350   (screen)
//
//      at the resolved camera (f74 onward), and every LABEL that is on screen
//      inside the same box during the tight opening (the axis rules may still
//      bleed off there, as in V1).
//
//      It is bought in WORLD space, not by shrinking type: the chart area went
//      x 150→930 to x 200→880 (780 px wide -> 680) and y 1300/400 to 1240/480
//      ($0 / $500; 900 px tall -> 760), and the furniture moved with it by the
//      same offsets it always had. Every type size is V1's, to the px.
//      The resolved k / cx / cy were then RE-SOLVED against the new box the way
//      V1 solved them — the analytic ink bbox below (INK_X0…INK_Y1), checked
//      against the MEASURED bbox of the render (`hu2-check.ts` for the solve,
//      `hu2-band.py` for the measurement). Measured on the f74-f119 renders:
//      x 131…949, y 408…1261 — 11-14 px of air on the left, 11-13 on the
//      right, 108-113 above, 89-94 below. V1 measured x 67…1015, y 315…1336.
//
//   2. THE ANIMATION IS STRETCHED. V1 was done at f44 of 120 — the user: "it
//      stops pretty much halfway in". The same 120 frames now carry:
//      the calm draw f0 -> f46 (was f0 -> f26), the hurricane f46 -> f66 (was
//      f26 -> f38), so the price is already climbing under "hurricane"
//      (f38-f59) and tops out on "existed" (f59-f78) rather than landing on
//      "hurricane" and then sitting still for 76 frames. Same flat-topped
//      calm ease, same single continuous arc-length track, `SPIKE_M0` re-solved
//      from the NEW hand-off speed so the spike still accelerates out of the
//      calm with no restart. `$17`'s timing is untouched.
//
// ---------------------------------------------------------------------------
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
//   1. CALM                                                      f0 -> f46
//      The head draws Dec 1 -> Jan 21 (days 0-51) on a flat-topped ease —
//      CALM_A of ramp, then one level speed — level and unremarkable, and now
//      it runs under the whole first half of the line rather than being spent
//      by "mile". The tip dot leads in ink. `$17` fades in at f2 over 6 frames
//      (V1's timing, kept). The camera is parked TIGHT on the flat stretch
//      (k K_TIGHT, cx X_TIGHT, the line's December level at the caption-safe
//      centre): the $0 and $250 ticks and the Dec label are in frame, the $500
//      tick and the GameStop badge are above it.
//
//   2. THE HURRICANE                                            f46 -> f66
//      The same track keeps running: Jan 22 -> Jan 28, days 51-58, almost
//      vertical. One Hermite whose opening slope IS the calm's speed, so it
//      accelerates out of the flat without a restart, peaks on the Jan 26 ->
//      Jan 27 leg and decelerates into $483 at f66 — two frames ahead of
//      "existed" (f68), with the climb running right through "hurricane"
//      (f38-f59) — with PEAK_OVER px of settle past it (a zero-sloped bump,
//      the house way of writing back(0.75)). The tip dot turns ACCENT the
//      moment the Jan 22 point is passed (F_SQUEEZE, solved): the squeeze is
//      the only accent on the chart. The camera is BLOWN OPEN by it — one
//      continuous move, keys f48-f64, warp 0.72 (V1's warp), k 1.22 -> 0.94
//      while it tilts up 373 world px to catch the line. It starts TWO FRAMES
//      AFTER the spike does, so the line kicks out of the calm inside the
//      tight frame — the tip crosses 36 screen px/frame at f49, its fastest
//      of the cut — and the frame then reacts to it. Solved against the
//      damper: k within 1% at f69, within 0.5% and 3 px of cy at f72, dead at
//      f74. The alternatives (keys f42-58 … f50-64) were all swept; this one
//      is the only window that both lands by f72 and lets the spike read at
//      tight k, and it keeps the tip 74 px clear of the right edge and 174 px
//      clear of the top of the padding box at its highest.
//
//   3. THE PEAK, HELD                                          f68 -> f120
//      `$483` pops in at f68, ON "existed" (6-frame scale-in 0.6 -> 1 on
//      back(0.75) at the peak, the half-step wash for 3 frames, then it holds).
//      The tip dot stays accent on the peak and strains STRAIN_AMP px against
//      it. The camera is fully settled by ~f76 and rides `sway` alone.
//      "I didn't know that could happen" plays over the held peak. Nothing
//      fades out.
//
// THE FRAME TABLE (V2)                                (V1, for comparison)
//   f0            the draw starts, camera parked tight  f0
//   f2  -> f8     `$17` fades in                        f2 -> f8   (unchanged)
//   f46           Jan 21 (day 51) reached, the calm     f26
//                 is spent; the spike leaves at the
//                 calm's own speed, 14.88 world px/f
//   f47.75        the tip crosses Jan 22 and goes       f27.05
//                 accent over 3 frames (F_SQUEEZE)
//   f48 -> f64    the camera is blown open, k 1.22 ->   f22 -> f32
//                 0.94, cy 1206 -> 833, cx 461 -> 561
//   f66           $483 — the peak, 2 frames ahead of    f38
//                 "existed"; PEAK_OVER settle to f72
//   f68           `$483` pops, ON "existed"             f40
//   f69/f72/f74   the camera within 1% / 0.5% / dead    f65/f68/f70
//   f72 -> f120   the held peak; the tip strains        f44 -> f120
//                 against the high, ±2 px on a 33-f
//                 period, and the camera rides `sway`
//
// DEVIATIONS from the original brief, inherited from V1 and re-solved here
// (all three are forced by the brief's own rules — the speed cap, the content
// band and "the tip stays inside the frame every frame"):
//
//   * THE OPENING k IS K_TIGHT, NOT 2.2. At k 2.2 the frame is 491 world px
//     wide and the head leaves it long before the pull-back starts. K_TIGHT is
//     the tightest k that holds the left-hand axis labels and the Jan 21 point
//     inside the NEW 120/960 band at once — tighter arithmetic than V1's,
//     because the band is 120 px narrower. The SHOT survives: the flat stretch
//     fills the width, the $500 tick sits above the top of the frame and the
//     GameStop badge is out of view until the line forces the frame open.
//   * THE CAMERA LANDS AT cx X_WIDE / k K_WIDE, not cx 540 / k 1.00. The
//     resolved picture spans world x INK_X0 … INK_X1; K_WIDE is the largest k
//     that fits that span (plus `sway`'s ±3 px of drift) inside 840 screen px
//     with a real margin, and X_WIDE centres it.
//   * THE CAMERA PANS. `camMove`/`runCamera` only carry cy and k, so cx gets
//     its own key-per-frame track through the SAME damper (`runCamera` with an
//     inert k channel) and the kraft takes cx/cxRest, which `GridBackground`
//     already supports.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 120;

// -- type -------------------------------------------------------------------
// Söhne, vendored, three weights for three jobs, loaded at module scope so a
// font failure surfaces before a frame is drawn. Separate families rather than
// weights of one family: a browser asked for a weight it does not have will
// synthesise it instead of failing. Sizes are V1's, unchanged.
export const FONT_AXIS = "SohneBuchHU";
export const FONT_PRICE = "SohneKraftigHU";
export const FONT_TITLE = "SohneHalbfettHU";
loadFont({ family: FONT_AXIS, url: staticFile("Sohne-Buch.otf"), weight: "400" });
loadFont({ family: FONT_PRICE, url: staticFile("Sohne-Kraftig.otf"), weight: "500" });
loadFont({ family: FONT_TITLE, url: staticFile("Sohne-Halbfett.otf"), weight: "600" });

// -- the drawing surface ----------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1450;

// -- the padding contract ---------------------------------------------------
// CHANGE 1. The box every piece of ink has to live inside at the resolved
// camera, and every on-screen label has to live inside at any time.
export const PAD_X0 = 120;
export const PAD_X1 = 960;
export const PAD_Y0 = 300;
export const PAD_Y1 = 1350;

// -- the chart's geometry, in world px --------------------------------------
// CHANGE 1, in world space: 680 x 760 where V1 had 780 x 900. Every piece of
// furniture below keeps the offset from the chart it had in V1.
export const X0 = 200; // day 0        (V1 150)
export const X1 = 880; // day 58       (V1 930)
export const DAY_MAX = 58;
export const Y0 = 1240; // $0          (V1 1300)
export const Y1 = 480; // $500         (V1 400)
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
export const S_CALM = CUM[CALM_LAST]; // the chart drawn in the calm
export const S_TOTAL = CUM[CUM.length - 1]; // to the peak
export const S_SPIKE = S_TOTAL - S_CALM; // the hurricane
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
// CHANGE 2. V1: 26 / 38 / 44 / 40. The window is 1.77x longer and the spike
// 1.67x longer, on the same 120 frames.
export const F_CALM1 = 46; // Jan 21 (day 51) is reached
export const F_PEAK = 66; // $483 — two frames ahead of "existed" (f68)
export const F_SETTLE1 = 72; // the settle past the peak is spent (6 frames, as V1)
export const F_LABEL = 68; // "$483" pops in, ON "existed"

// The calm's speed profile: a smoothstep ramp over the first CALM_A of the
// window, then one flat speed to F_CALM1. Flat-topped, so the peak is only
// 1/(1 - CALM_A/2) = 1.11x the average and the hand-off to the spike is the
// steady speed rather than a decaying one. Unchanged from V1 in shape; only
// the window it is stretched over changed.
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
// Arc px per frame at F_CALM1-: what the spike has to start at to be one
// motion. RE-SOLVED for the new window and the new chart size.
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
// over F_PEAK..F_SETTLE1 — zero value AND zero slope at both ends — rather
// than as Easing.out(Easing.back(0.75)) hung off the end of the travel, which
// would put a velocity step at the join.
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
// k falls K_TIGHT -> K_WIDE while the content centre climbs to catch the peak,
// keys CAM_F0-CAM_F1 on warp 0.72 (V1's warp), landed by f72, fully settled by
// ~f76 — the damper runs 8-10 frames past the last key, measured on V1.
//
// The two binding frames, both solved against the NEW 120/960 x band:
//   K_TIGHT  the $250/$0/Dec/$17 labels inside 120/960 and the Jan 21 point
//            inside it too, at the same time; $500, the title and the badge
//            are above the frame
//   K_WIDE   the whole resolved picture, world x INK_X0…INK_X1 and
//            y INK_Y0…INK_Y1, inside 120/960 x 300/1350 with a margin
export const K_TIGHT = 1.22;
export const C_TIGHT = 1206; // the line's December level, at the caption-safe centre
export const X_TIGHT = 461;
export const K_WIDE = 0.94;
export const C_WIDE = 833; // the whole chart framed; the ink's own centre
export const X_WIDE = 561;
// Two frames after the spike starts, so the line kicks out of the calm inside
// the tight frame and the camera reacts to it; 16 frames of move, which the
// damper carries to 1% of K_WIDE by f69, 0.5% by f72 and dead by f74.
export const CAM_F0 = 48;
export const CAM_F1 = 64;
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
// Sizes are V1's to the px. Positions carry V1's offsets onto the new chart.
export const AXIS_OP = 0.55;
export const AXIS_SIZE = 26;
export const AXIS_LABEL_X = 188; // labels right-aligned to here (X0 - 12, as V1)
export const TICK = 10; // tick length, out of the axis
export const STROKE = 2.5; // the one stroke weight in the piece
export const TIP_R = 5;
export const Y_TICKS = [0, 250, 500];
export const X_TICKS: { day: number; label: string }[] = [
  { day: 0, label: "Dec" },
  { day: 31, label: "Jan" },
];
export const TITLE_X = 200; // = X0, as V1
export const TITLE_Y = 420; // baseline, 60 above the $500 tick, as V1
export const TITLE_SIZE = 40;
export const BADGE_X = 168; // the cart card, to the title's left (TITLE_X - 32)
export const BADGE_Y = 407; // TITLE_Y - 13, as V1
export const BADGE_SIZE = 56;
export const START_LABEL_X = 193; // "$17", right-aligned, above-left of Dec 1
export const START_LABEL_Y = 1195; // ~21 above priceY(15.80), as V1
export const START_LABEL_SIZE = 30;
export const START_LABEL_OP = 0.85;
export const F_START_LABEL = 2; // V1's timing, untouched
export const START_LABEL_FADE = 6; // V1's timing, untouched
export const PEAK_LABEL_X = 890; // "$483", to the right of the Jan 28 point
export const PEAK_LABEL_Y = 521; // ~15 below priceY(483), as V1
export const PEAK_LABEL_SIZE = 44;
export const PEAK_LABEL_GROW = 6;
export const PEAK_LABEL_FROM = 0.6;
export const HALF_STEP = "#FFD98A"; // the 3-frame wash on the label's arrival
export const HALF_STEP_HOLD = 3;
export const EASE_LAND = Easing.out(Easing.back(0.75));

// The analytic ink bbox the resolved camera is solved against. Glyph advance
// measured off the V1 render at 0.591 em for Söhne digits and caps; 0.607 is
// carried here so the solve stays on the safe side of the measurement.
export const EM = 0.607;
export const INK_X0 = AXIS_LABEL_X - 4 * EM * AXIS_SIZE; // the "$500"/"$250" left edge
export const INK_X1 = PEAK_LABEL_X + 4 * EM * PEAK_LABEL_SIZE; // the "$483" right edge
export const INK_Y0 = BADGE_Y - BADGE_SIZE / 2; // the badge's top
export const INK_Y1 = Y0 + TICK + AXIS_SIZE + 6 + AXIS_SIZE * 0.22; // the month labels' bottom

// -- the beat table ---------------------------------------------------------
// The word onsets are the SRT's and did not change; only what happens on them.
export const BEATS = {
  i: 0,
  didnt: 7,
  know: 11,
  there: 15,
  was: 20,
  a: 22,
  fiveHundred: 24,
  mile: 33,
  hurricane: 38, // the price is climbing under this word now, not landing on it
  that: 59,
  existed: 68, // the peak lands 2 frames ahead of it; "$483" pops on it
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
    fiveHundred: z.number(), // "500"
    mile: z.number(), // "mile"
    hurricane: z.number(), // "hurricane"  — the line is climbing through it
    that: z.number(), // "that"
    existed: z.number(), // "existed"     — the peak, and "$483"
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

const FiveHundredMileHurricaneV2: React.FC<Props> = ({
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

export default FiveHundredMileHurricaneV2;

// The joins the whole cut rests on, asserted so a change to the window or the
// ease cannot quietly turn one motion into two, or slide the peak off its word.
if (Math.abs(drawnLength(F_PEAK) - S_TOTAL) > 0.01) {
  throw new Error(
    `FiveHundredMileHurricaneV2: the head is at ${drawnLength(F_PEAK).toFixed(2)} on f${F_PEAK}, not the peak (${S_TOTAL.toFixed(2)})`,
  );
}
// The house rule: an arrival settles 0-10 frames BEFORE its word, never after.
if (BEATS.existed - F_PEAK < 0 || BEATS.existed - F_PEAK > 10) {
  throw new Error(
    `FiveHundredMileHurricaneV2: the peak on f${F_PEAK} does not land just ahead of "existed" (f${BEATS.existed})`,
  );
}
// The spike must stay one motion with the calm: P'(u) = (1-u)(m0 + (6-3m0)u)
// is monotone only for m0 in [0, 2).
if (!(SPIKE_M0 >= 0 && SPIKE_M0 < 2)) {
  throw new Error(`FiveHundredMileHurricaneV2: SPIKE_M0 ${SPIKE_M0.toFixed(3)} is outside [0, 2)`);
}
