import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  FONT_NUM,
  GEO,
  METRIC,
  SPACE,
  TILE_TOP,
  TRACK,
  TYPE,
  ChartBar,
  Label,
  LightSweep,
  Numeral,
  Pillar,
  Rule,
  StoutStage,
  amberBandFor,
  camFor,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  TNUM_ADV,
  numeralWidth,
  smoothstep,
  snapLen,
} from "./stoutShared";
import { cameraTrack } from "./outgrowShared";
import type { Cam, Glide } from "./outgrowShared";
import { V3_DATA } from "./BackInTheDayV3";
import { V2_YEARS, V2_YEAR_LABELS } from "./wolffActA2";
import { NOW_REV_PX, NOW_SLICE_PX } from "./wolffShared";

// ---------------------------------------------------------------------------
// stoutActA — ACT A of the Toto Wolff clip in the STOUT system: cut 1
// `BillionInRevenueStout` (S_A 0-124) and cut 2 `BackInTheDayStout` (S_A
// 124-324) are ONE world on ONE story clock. Camera, light pool, sway, grain
// (on twos) and every track are functions of S_A, so cut 2's f0 IS cut 1's
// f124. Both cuts render `ActAStout` and nothing else.
//
// Built only from stoutShared's tokens and components. Three small pieces it
// lacks are written here from its tokens (reported): ToneNumeral (a numeral
// whose TONE mixes cream -> creamLo, for "$1B" dimming by tone), PourEdge (the
// cream's lit top edge riding the pour's boundary down), and the axis head
// (the time axis drawing leftward just ahead of the frame).
//
// The words, beats, joins and story are V1/V2/V3's (BillionInRevenue,
// BackInTheDayV3); the look, scale and finish are stout's. The resting
// cameras are StoutFrames' (c1_end, c2_hold, c2_end), re-solved into the house
// rig (cameraTrack: superposed glides + damper; look = centre - 125 / k).
//
// DATA: now = Toto's $1B / $300M (NOW_REV_PX 160 / NOW_SLICE_PX 48 at 160 px per
// $B, act A's MONEY); the history = V3_DATA (BackInTheDayV3: the filed accounts,
// USD at the Fed's yearly rates; "$326M", 392 ... 836; years 2015 / 2020 / 2025).
// ---------------------------------------------------------------------------

export const DUR_1 = 125; // round((8.099 - 3.560) * 24) = 109, + 16
export const DUR_2 = 201; // round((20.480 - 12.759) * 24) = 185, + 16
export const S_JOIN = DUR_1 - 1; // 124
export const S_END = S_JOIN + DUR_2 - 1; // 324
export const c2 = (f: number) => S_JOIN + f;

const X_NOW = GEO.X_NOW;
const FLOOR = GEO.FLOOR;
export const NOW_BAR = NOW_REV_PX; // 160 = $1B
export const NOW_SLICE = NOW_SLICE_PX; // 48 = $300M

// --- the history (cut 2): stout's chart geometry, exactly StoutFrames' ---------------------------
export const hx = (year: number) => X_NOW - GEO.TILE / 2 - GEO.HIST_GAP_NOW - GEO.HIST_BAR / 2 - (2025 - year) * GEO.HIST_PITCH;
export const AXIS_X0 = hx(2015) - GEO.HIST_BAR / 2 - 16; // where the time axis begins
export const AXIS_X1 = X_NOW - GEO.TILE / 2; // it runs into the now tile's top-left corner

// --- the resting cameras (StoutFrames) ---------------------------------------------------------------
export const K1 = 3.25;
export const CAM_C1 = camFor(X_NOW, FLOOR, 470, 1368, K1); // c1_end
export const K2H = 3.0;
export const CAM_C2H = camFor(hx(2015), TILE_TOP, 560, 960, K2H); // c2_hold
export const K2E = 1.375;
export const CAM_C2E = camFor(X_NOW, TILE_TOP, 912, 899, K2E); // c2_end

// The history's heights, snapped to whole screen px at the chart's resting k (one constant per bar:
// no per-frame snapping, so nothing shimmers while the camera moves).
export const HIST = V2_YEARS.map((year, i) => ({
  year,
  x: hx(year),
  h: snapLen(V3_DATA.bar[i], K2E),
  slice: snapLen(V3_DATA.slice[i], K2E),
  value: V3_DATA.value[i],
}));

// ===========================================================================
// THE CAMERA — one track for the act (cameraTrack: glides superposed, then the
// house damper; `look` = the content centre, centre = look + 125 / k). Cut 1's
// glides were solved so S_A 124 lands on c1_end's camera; cut 2's ride was
// fitted (least squares on the damped track) so the pan is monotone and the
// look reaches 2020 on "300 million"; the hold lands on c2_hold, the end on
// c2_end. PRE frames of pre-roll so the opening creep is moving on f0.
// ===========================================================================
export const CAM_PRE = 30;
export const CAM_START = { x: 557.5384615384622, y: 1188.0074262144446, k: 3.4577290954498294 };
export const CAM_GLIDES: Glide[] = [
  // cut 1 (S = f)
  { f0: -30, f1: 22, dy: -3, k: 3.4992218445952274, warp: 1 }, // the creep already running on f0: close, the tile low, room above (well, we're)
  { f0: 6, f1: 38, dx: 8, dy: -40, k: 3.12, warp: 0.9 }, // rides the top up and eases back (generating ... billion)
  { f0: 32, f1: 92, dy: -10, k: 3.22, warp: 1 }, // creeps toward the bar's top third (dollars in revenue ... 30%)
  { f0: 80, f1: 150, dy: -5, k: 3.268, warp: 1 }, // the creep carrying on and decaying into c1_end (profit margin)
  // cut 2 (S = 124 + f)
  { f0: c2(0), f1: c2(42), k: 2.4, dy: 20, warp: 1 }, // eases back a little (back in the day)
  { f0: c2(0), f1: c2(46), dx: -177.2, warp: 1 }, // and glides LEFT into the past (it wasn't a billion)
  { f0: c2(22), f1: c2(74), dx: -269.9, warp: 1 }, // (and it wasn't 300 million)
  { f0: c2(50), f1: c2(96), dx: -141.29, warp: 1 }, // decelerates onto 2015 (it was)
  { f0: c2(74), f1: c2(94), k: K2H, dy: 8.34, warp: 1 }, // creeps in on $326M, then still ~f100-106 (considerably less)
  { f0: c2(106), f1: c2(172), dx: 296.21, dy: -4.89, k: K2E, warp: 0.9 }, // turns back right and pulls back to the whole climb (because we're growing very strong ...)
];
export const CAM_TRACK: Cam[] = cameraTrack(
  CAM_START,
  CAM_GLIDES.map((g) => ({ ...g, f0: g.f0 + CAM_PRE, f1: g.f1 + CAM_PRE })),
  S_END + CAM_PRE + 4,
).slice(CAM_PRE);
export const camAt = (S: number): Cam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(S)))];
export const CAM_REST: Cam = CAM_TRACK[0];

// ===========================================================================
// CUT 1 — "Well, we're generating around a billion dollars in revenue and 30%
// profit margin." ONE RISE AND ONE POUR. (S = cut-1 frame)
// ===========================================================================
export const C1 = {
  TILE_IN: [0, 10], // the tile slides up + fades in, lifted, and settles on its contact shadow (well, we're)
  RISE: [10, 27], // the bar rises out of the tile's slot, lands 2 f before "billion" (f29)
  SETTLE: [27, 8, 2.5], // its zero-sloped settle
  REVENUE_IN: 34, // REVENUE blurs in under "$1B", lands f46 ("revenue")
  POUR: [56, 66], // the amber pours down to the 70 % line, the cream's lit edge riding it (and 30 ...)
  EDGE_FADE: 66, // the lit edge fades into the slice's lower edge over 12 f
  THIRTY_IN: 58, // "30%" blurs in right of the slice, lands f70 ("30" ~f68)
  SWEEP: 70, // THE ONE CLICK: a light sweep across the amber slice as "30%" lands, 10 f
  PROFIT_IN: 72, // PROFIT blurs in under it, lands f84 ("profit")
} as const;
export const ENTER_F = 12;
export const SWEEP_F = 10;

// --- cut 1's arrival at "$1B": two versions, chosen by BillionInRevenueStout's `billion` prop ---------
//   "quick"  — the delivered cut (Oct 2 2026), bit for bit: C1.RISE smoothstep + the 2.5 px settle;
//              the readout's last step "$900M" -> "$1B" passes in ~3.4 f (f23.7-27).
//   "gentle" — Tom's note ("too fast ... it should be more gentle when it reaches 1 billion"): ONE
//              decelerating arrival. The bar rises from rest at f10 on one curve and lands with zero
//              velocity at f35 (no settle); the odometer slows with it; "$900M" holds sharp f24-27;
//              then a slow drum turn f27-41 (the director's V2 of the swap): "$900M" rolls up and
//              out, "$1B" rolls up and in, never overlapping, full opacity inside a feathered line.
// Cut 2 (S >= 124) is identical under both (the light pool's damped difference is < 1e-9 px by
// then), so ActAStout defaults to "quick" and BackInTheDayStout never passes it.
export type Billion = "gentle" | "quick";
export const C1G = {
  RISE: [10, 35], // same start; zero velocity at f35 ("billion" f29, "dollars" f34)
  // p(t) = 1 - (1 - t)^b (1 + b t): velocity ∝ t (1 - t)^(b - 1), ONE smooth curve from rest to rest
  // (no piecewise join). b = 4.25: 90 % ("$900M") at f24.1, the last 10 % over 10.9 f, top speed
  // 43.5 screen px/f (the delivered rise: 42).
  SHAPE: 4.25,
  // THE DRUM TURN. It is triggered when the bar reaches the top of its rise (96.9 % of its height,
  // f26.98 -> the turn starts on whole frame f27; on screen the bar is still from ~f28), then runs on
  // time, not on the bar's last sub-pixels: TURN_F frames of smootherstep, "$1B" landing at f41.
  TURN_V: 9.69,
  TURN_F: 14,
  // The line: a window fully opaque over the glyphs' rest extents (the "$" reaches 0.818 em up and
  // 0.102 em down, + 0.02 em) with FEATHER-deep alpha ramps above and below. A string fades only while
  // it crosses an edge. TRAVEL is the least drum pitch that puts each string wholly beyond the ramps
  // at the ends (>= 1.19 em) + 0.03 em, so the two strings never overlap (gap >= 0.3 em) and neither
  // is visible outside the line.
  CORE: [0.838, 0.122], // em above / below the baseline
  FEATHER: 0.25, // em
  TRAVEL: 1.22, // em
  ROLL_BLUR: 2, // SCREEN px of vertical blur at the turn's top speed (in proportion to it, 0 at both ends)
  REVENUE_IN: 39, // REVENUE blurs in under the landing "$1B", lands f51 ("revenue" f46)
} as const;

const settleBump = (t: number, dur: number, amp: number) => (t <= 0 || t >= dur ? 0 : amp * Math.pow(Math.sin((Math.PI * t) / dur), 2));
const riseGentle = (S: number) => {
  const [a, b] = C1G.RISE;
  const t = clamp01((S - a) / (b - a));
  return 1 - Math.pow(1 - t, C1G.SHAPE) * (1 + C1G.SHAPE * t);
};
export const barRise = (S: number, billion: Billion = "quick") => {
  if (billion === "gentle") return NOW_BAR * riseGentle(S);
  const [a, b] = C1.RISE;
  const [s0, dur, amp] = C1.SETTLE;
  return NOW_BAR * smoothstep((S - a) / (b - a)) + settleBump(S - s0, dur, amp);
};
export const pourH = (S: number) => NOW_SLICE * smoothstep((S - C1.POUR[0]) / (C1.POUR[1] - C1.POUR[0]));
/** The readout's odometer value: tenths of a billion, "$100M" ... "$900M" -> "$1B". */
export const readoutValue = (S: number, billion: Billion = "quick") => Math.min(10, (barRise(S, billion) / NOW_BAR) * 10);
export const readoutFormat = (n: number) => (n >= 10 ? "$1B" : n <= 0 ? "$0" : `$${n}00M`);
/** It appears as the bar passes its first $100M (the mechanism, not a timer). */
const readoutInOf = (billion: Billion) => {
  for (let s = 0; s < 60; s += 0.01) if (readoutValue(s, billion) >= 1) return Number(s.toFixed(2));
  return 13;
};
export const READOUT_IN = readoutInOf("quick");
export const READOUT_IN_GENTLE = readoutInOf("gentle"); // 12.67
/** Gentle: where the odometer's digits stand (Numeral's roll eases in and out of every step, so its
 *  digits rest on each value); "$900M" holds from 90 %. Its slope over one frame is the count's blur. */
const shownGentle = (S: number) => {
  const v = readoutValue(S, "gentle");
  if (v >= 9) return 9;
  const n = Math.floor(v);
  return n + smoothstep(v - n);
};
/** Gentle: the turn is triggered on the first whole frame the bar has reached C1G.TURN_V (the top
 *  of its rise), then runs on time. */
export const TURN_AT = (() => {
  for (let s = C1G.RISE[0]; s <= C1G.RISE[1]; s += 0.01) if (readoutValue(s, "gentle") >= C1G.TURN_V) return Math.ceil(s - 1e-9);
  return C1G.RISE[1];
})(); // 27
export const TURN_END = TURN_AT + C1G.TURN_F; // 41: "$1B" lands
const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** Gentle: the drum turn's progress 0 ("$900M") .. 1 ("$1B"), smootherstep over TURN_F frames. */
export const turnGentle = (S: number) => smootherstep((S - TURN_AT) / C1G.TURN_F);
/** Its roll blur (SCREEN px): in proportion to the turn's speed (30 x^2 (1-x)^2), peak ROLL_BLUR, 0 at both ends. */
export const turnBlur = (S: number) => {
  const x = clamp01((S - TURN_AT) / C1G.TURN_F);
  return C1G.ROLL_BLUR * 16 * x * x * (1 - x) * (1 - x);
};

// cut 1's lockup, laid out exactly as StoutFrames' c1_end: SCREEN px offsets from the
// pillar at camera k, returned in WORLD px (the type stays on its token at any k).
export const nowLockup = (k: number, barH: number) => {
  const barTop = TILE_TOP - barH;
  const revenueY = barTop - SPACE.CLEAR / k;
  const billionY = revenueY - (TYPE.LABEL * METRIC.cap + SPACE.LOCKUP) / k;
  const lock = TYPE.SECONDARY * METRIC.fig + SPACE.LOCKUP + TYPE.LABEL * METRIC.cap;
  const sliceTop = TILE_TOP - NOW_BAR;
  const pctY = sliceTop + (NOW_SLICE - lock / k) / 2 + (TYPE.SECONDARY * METRIC.fig) / k;
  const profitY = pctY + (SPACE.LOCKUP + TYPE.LABEL * METRIC.cap) / k;
  const sideX = X_NOW + GEO.BAR / 2 + SPACE.CLEAR / k;
  return { revenueY, billionY, pctY, profitY, sideX };
};

// ===========================================================================
// CUT 2 — "Back in the day it wasn't a billion and it wasn't 300 million. It
// was considerably less, because we're growing very strong, and the sport is
// still growing strong." ONE THERE-AND-BACK LOOK. (cut-2 frames f)
// ===========================================================================
export const C2 = {
  LABELS_OUT: 2, // REVENUE, 30%, PROFIT leave (the reverse entrance); "$1B" dims by tone (back in the day it wasn't a billion)
  RETURN: [106, 172], // the return glide (matches CAM_GLIDES)
} as const;
// The reveal: a year's bar rises from the axis when the camera's look reaches it (the reveal
// line sits REVEAL_PX left of the frame's centre and only moves left), so the slices thin to
// slivers through "300 million" and 2015 rises for "considerably less".
export const REVEAL_PX = 176;
// 16 f per rise keeps the tallest bars (2024 / 2025, ~350 screen px at the ride's k) under the
// 45 px/f cap with the pan included (12 f measured 49-52 px/f); each figure blurs in behind its
// bar and lands with it.
export const RISE_F = 16;
export const LABEL_LAG_F = RISE_F - ENTER_F; // 4
export const REVEAL_F: number[] = (() => {
  const out = HIST.map(() => NaN);
  let line = Infinity;
  for (let f = 0; f <= DUR_2; f += 0.05) {
    const c = camAt(S_JOIN + Math.round(f));
    line = Math.min(line, c.x - REVEAL_PX / c.k);
    HIST.forEach((b, i) => {
      if (Number.isNaN(out[i]) && line <= b.x) out[i] = Number(f.toFixed(2));
    });
  }
  return out;
})();
/** "$326M" lands here, with the 2015 bar (f91.5, "considerably" f91). Cut 2 has no click: the
 *  director removed its cream-on-cream sweep (barely visible is worse than none). */
export const CALLOUT_LAND_F = REVEAL_F[0] + LABEL_LAG_F + ENTER_F;
/** The return's progress 0 (the hold) .. 1 (the end), the camera's own (log k). */
export const returnProgress = (f: number) => {
  const k = camAt(S_JOIN + f).k;
  return f < C2.RETURN[0] ? 0 : clamp01((Math.log(K2H) - Math.log(k)) / (Math.log(K2H) - Math.log(K2E)));
};
/** The now pillar's chart figures ("$1B" over its bar, "30%" on its slice) blur in once the whole
 *  pillar is inside the returning frame (its tile's right edge on screen): f161, so "$1B" lands
 *  f173 and "30%" on "strong" (f176). */
export const NOW_LABELS_F = (() => {
  for (let f = C2.RETURN[0]; f <= DUR_2; f++) {
    const c = camAt(S_JOIN + f);
    if (540 + (X_NOW + GEO.TILE / 2 - c.x) * c.k <= 1080) return f;
  }
  return DUR_2;
})();
/** The dimmed HERO "$1B" stops being drawn once the camera has left it (it never comes back). */
export const BILLION_GONE_F = (() => {
  for (let f = 0; f <= DUR_2; f++) {
    const c = camAt(S_JOIN + f);
    const left = 540 + (X_NOW - c.x) * c.k - numeralWidth("$1B", TYPE.HERO) / 2;
    if (left > 1080 + 40) return f;
  }
  return DUR_2;
})();
// The axis: draws leftward from the now tile's top-left corner, races to just beyond the frame's
// left edge (at most 45 screen px/f) and keeps ahead of it; it never retracts.
export const AXIS_WAVE_SCREEN_PX = 40;
export const AXIS_LEAD_PX = 32;
export const AXIS_HEAD: number[] = (() => {
  const out: number[] = [];
  let head = AXIS_X1;
  for (let f = 0; f <= DUR_2 + 1; f++) {
    const c = camAt(S_JOIN + f);
    const frameLeft = c.x - (540 + AXIS_LEAD_PX) / c.k;
    const wave = AXIS_X1 - (AXIS_WAVE_SCREEN_PX / c.k) * f;
    head = Math.min(head, Math.max(AXIS_X0, Math.max(frameLeft, wave)));
    out.push(head);
  }
  return out;
})();

// ===========================================================================
// THE LIGHT POOL — follows the subject with a lag (the camera's own damper).
// ===========================================================================
const POOL_STIFF = 0.09;
const POOL_DAMP = 0.468;
const poolTarget = (S: number, billion: Billion) => {
  const f = S - S_JOIN;
  if (f <= 0) return { x: X_NOW, y: TILE_TOP - barRise(S, billion) / 2 }; // the pillar, its bar's middle (c1_end)
  // cut 2: the newest year the look has reached, then back to the whole climb's middle
  let line = Infinity;
  for (let g = 0; g <= Math.min(f, C2.RETURN[0]); g++) {
    const c = camAt(S_JOIN + g);
    line = Math.min(line, c.x - REVEAL_PX / c.k);
  }
  const hold = { x: Math.max(hx(2015), Math.min(X_NOW, line)), y: TILE_TOP - 60 }; // c2_hold
  const end = { x: (hx(2015) + X_NOW) / 2, y: TILE_TOP - 80 }; // c2_end
  const p = smoothstep(returnProgress(f));
  return { x: lerp(hold.x, end.x, p), y: lerp(hold.y, end.y, p) };
};
const poolTrackOf = (billion: Billion) => {
  const out: { x: number; y: number }[] = [];
  let p = poolTarget(0, billion);
  let v = { x: 0, y: 0 };
  for (let S = 0; S <= S_END + 1; S++) {
    if (S > 0) {
      const t = poolTarget(S, billion);
      v = { x: v.x + (t.x - p.x) * POOL_STIFF - v.x * POOL_DAMP, y: v.y + (t.y - p.y) * POOL_STIFF - v.y * POOL_DAMP };
      p = { x: p.x + v.x, y: p.y + v.y };
    }
    out.push({ ...p });
  }
  return out;
};
export const POOL_TRACK: { x: number; y: number }[] = poolTrackOf("quick");
/** The pool follows the gentle bar's middle the same way (it converges on the quick track: < 1e-9 px by S 124). */
export const POOL_TRACK_GENTLE: { x: number; y: number }[] = poolTrackOf("gentle");

// ===========================================================================
// PIECES stoutShared lacks, from its tokens
// ===========================================================================
/** A static numeral whose TONE mixes cream -> creamLo by `dim` (0..1): Numeral's static branch
 *  with a mixed fill, so a figure dims by tone, never by opacity. */
const ToneNumeral: React.FC<{ x: number; y: number; k: number; px: number; text: string; dim: number; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  k,
  px,
  text,
  dim,
  anchor = "middle",
}) => {
  const fs = px / k;
  const comp = anchor === "middle" ? (TRACK.numeral * fs) / 2 : anchor === "end" ? TRACK.numeral * fs : 0;
  return (
    <g opacity="1">
      <text
        x={(Math.round((x + comp) * 1000) / 1000).toString()}
        y={(Math.round(y * 1000) / 1000).toString()}
        fontFamily={FONT_NUM}
        fontWeight={700}
        fontSize={(Math.round(fs * 1000) / 1000).toString()}
        letterSpacing={`${TRACK.numeral}em`}
        textAnchor={anchor}
        fill={mixHex(COLOR.inkCream, COLOR.inkCreamLo, dim)}
        style={{ fontFeatureSettings: '"lnum" 1' }}
      >
        {text}
      </text>
    </g>
  );
};

/** The pour's leading edge: the cream's lit top edge (EDGE.CREAM, ALPHA.edge) at the boundary. */
const PourEdge: React.FC<{ y: number; k: number; on: number }> = ({ y, k, on }) =>
  on <= 0.001 ? null : (
    <path
      d={`M${X_NOW - GEO.BAR / 2 + GEO.RADIUS} ${y + EDGE.CREAM / k / 2}H${X_NOW + GEO.BAR / 2 - GEO.RADIUS}`}
      stroke={COLOR.edge}
      strokeOpacity={ALPHA.edge * on}
      strokeWidth={EDGE.CREAM / k}
    />
  );

/** The house entrance (stoutShared's, replicated for the pieces below): slide up 24 SCREEN px,
 *  fade, blur 6 -> 0, ease-out. */
const entranceOf = (enter: number) => {
  const a = easeOutCubic(enter);
  return { lift: (1 - a) * 24, opacity: a, blur: 6 * (1 - a) };
};
const r3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** The odometer's last step, "$900M" -> "$1B": the strings differ in length, so instead of a
 *  per-character roll (which would set "$1B" off-centre and snap it on landing) the whole
 *  centred "$900M" rolls up and out while the centred "$1B" rolls in from below, clipped to the
 *  line, with the same vertical motion blur. The outgoing string is laid out exactly as
 *  Numeral's odometer (tabular), the incoming exactly as its landed static text. */
const RollSwap: React.FC<{ x: number; y: number; k: number; px: number; from: string; to: string; roll: number; rollBlur: number; enter: number }> = ({
  x,
  y,
  k,
  px,
  from,
  to,
  roll,
  rollBlur,
  enter,
}) => {
  const uid = `rs${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const en = entranceOf(enter);
  if (en.opacity <= 0.002) return null;
  const fs = px / k;
  const yy = y + en.lift / k;
  // 1.3 em of travel: the incoming line starts well under the window, so its blurred tops never
  // peek in before the roll begins
  const lineH = fs * 1.3;
  const off = smoothstep(roll) * lineH;
  const adv = (c: string) => (/\d/.test(c) ? TNUM_ADV * fs : numeralWidth(c, fs)) + TRACK.numeral * fs;
  const widths = [...from].map(adv);
  const total = widths.reduce((a, w) => a + w, 0) - TRACK.numeral * fs;
  let cx = x - total / 2;
  const comp = (TRACK.numeral * fs) / 2;
  return (
    <g opacity={r3(en.opacity)} style={{ filter: en.blur > 0.05 ? `blur(${r3(en.blur / k)}px)` : undefined }}>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={r3(x - total / 2 - fs)} y={r3(yy - fs * 0.9)} width={r3(total + 2 * fs)} height={r3(fs * 1.06)} />
        </clipPath>
        {rollBlur > 0.05 ? (
          <filter id={`${uid}b`} x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${r3(rollBlur / k)}`} />
          </filter>
        ) : null}
      </defs>
      <g clipPath={`url(#${uid}c)`} fontFamily={FONT_NUM} fontWeight={700} fontSize={r3(fs)} fill={COLOR.inkCream}>
        <g filter={rollBlur > 0.05 ? `url(#${uid}b)` : undefined}>
          <g style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
            {[...from].map((c, i) => {
              const w = widths[i];
              const xc = cx + w / 2 - comp;
              cx += w;
              return (
                <text key={i} x={r3(xc)} y={r3(yy - off)} textAnchor="middle">
                  {c}
                </text>
              );
            })}
          </g>
          <text x={r3(x + comp)} y={r3(yy + lineH - off)} textAnchor="middle" letterSpacing={`${TRACK.numeral}em`} style={{ fontFeatureSettings: '"lnum" 1' }}>
            {to}
          </text>
        </g>
      </g>
    </g>
  );
};

/** Gentle: the odometer's last step as a slow drum turn. The same two strings, laid out as RollSwap's
 *  ("$900M" tabular as Numeral's odometer, "$1B" exactly as its landed static text), one drum pitch
 *  apart (C1G.TRAVEL): "$900M" rolls up and out while "$1B" rolls up and in. No opacity animation:
 *  the strings are seen through a FEATHERED line (a mask fully opaque over the glyphs' rest extents,
 *  with C1G.FEATHER-deep ramps above and below), so a string fades only while it crosses an edge.
 *  The pitch keeps them apart on every frame. At roll 0 it is the plain "$900M" (the hold): no mask,
 *  no filter. */
const DrumTurn: React.FC<{ x: number; y: number; k: number; px: number; from: string; to: string; roll: number; rollBlur: number; enter: number }> = ({
  x,
  y,
  k,
  px,
  from,
  to,
  roll,
  rollBlur,
  enter,
}) => {
  const uid = `dt${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const en = entranceOf(enter);
  if (en.opacity <= 0.002) return null;
  const fs = px / k;
  const yy = y + en.lift / k;
  const pitch = fs * C1G.TRAVEL;
  const u = clamp01(roll);
  const adv = (c: string) => (/\d/.test(c) ? TNUM_ADV * fs : numeralWidth(c, fs)) + TRACK.numeral * fs;
  const widths = [...from].map(adv);
  const total = widths.reduce((a, w) => a + w, 0) - TRACK.numeral * fs;
  let cx = x - total / 2;
  const comp = (TRACK.numeral * fs) / 2;
  const moving = u > 0;
  const blurOn = moving && rollBlur > 0.05;
  // the line: transparent at y0, opaque y1..y2, transparent at y3 (world px)
  const [coreUp, coreDown] = C1G.CORE;
  const y0 = yy - (coreUp + C1G.FEATHER) * fs;
  const y1 = yy - coreUp * fs;
  const y2 = yy + coreDown * fs;
  const y3 = yy + (coreDown + C1G.FEATHER) * fs;
  const mx = x - total / 2 - fs;
  const mw = total + 2 * fs;
  const outgoing = (dy: number) => (
    <g style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
      {[...from].map((c, i) => {
        const w = widths[i];
        const xc = cx + w / 2 - comp;
        cx += w;
        return (
          <text key={i} x={r3(xc)} y={r3(yy - dy)} textAnchor="middle">
            {c}
          </text>
        );
      })}
    </g>
  );
  return (
    <g opacity={r3(en.opacity)} style={{ filter: en.blur > 0.05 ? `blur(${r3(en.blur / k)}px)` : undefined }}>
      {moving ? (
        <defs>
          <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={r3(y0)} x2="0" y2={r3(y3)}>
            <stop offset="0" stopColor="#000" />
            <stop offset={r3((y1 - y0) / (y3 - y0))} stopColor="#fff" />
            <stop offset={r3((y2 - y0) / (y3 - y0))} stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={r3(mx)} y={r3(y0)} width={r3(mw)} height={r3(y3 - y0)}>
            <rect x={r3(mx)} y={r3(y0)} width={r3(mw)} height={r3(y3 - y0)} fill={`url(#${uid}g)`} />
          </mask>
          {blurOn ? (
            <filter id={`${uid}b`} x="-5%" y="-30%" width="110%" height="160%">
              <feGaussianBlur stdDeviation={`0 ${r3(rollBlur / k)}`} />
            </filter>
          ) : null}
        </defs>
      ) : null}
      <g fontFamily={FONT_NUM} fontWeight={700} fontSize={r3(fs)} fill={COLOR.inkCream} mask={moving ? `url(#${uid}m)` : undefined}>
        <g filter={blurOn ? `url(#${uid}b)` : undefined}>
          {outgoing(pitch * u)}
          {moving ? (
            <text x={r3(x + comp)} y={r3(yy + pitch * (1 - u))} textAnchor="middle" letterSpacing={`${TRACK.numeral}em`} style={{ fontFeatureSettings: '"lnum" 1' }}>
              {to}
            </text>
          ) : null}
        </g>
      </g>
    </g>
  );
};

/** Cut 1's readout riding the bar's top, all its phases: the odometer "$100M" ... "$900M"
 *  (stoutShared Numeral), the last step's RollSwap to "$1B", then the landed "$1B" (ToneNumeral,
 *  which also dims it by tone in cut 2). `billion` "gentle": the count's blur follows its digits'
 *  own speed (sharp as they rest on a value), "$900M" holds, then the DrumTurn f27-41. */
const HeroReadout: React.FC<{ x: number; y: number; k: number; S: number; enter: number; dim: number; billion: Billion }> = ({
  x,
  y,
  k,
  S,
  enter,
  dim,
  billion,
}) => {
  if (billion === "gentle") {
    const vg = readoutValue(S, "gentle");
    const u = turnGentle(S);
    if (u >= 1) return <ToneNumeral x={x} y={y} k={k} px={TYPE.HERO} text="$1B" dim={dim} />;
    if (vg >= 9 || u > 0) {
      return (
        <DrumTurn x={x} y={y} k={k} px={TYPE.HERO} from={readoutFormat(9)} to={readoutFormat(10)} roll={u} rollBlur={turnBlur(S)} enter={enter} />
      );
    }
    const blurG = Math.min(10, 9 * Math.abs(shownGentle(S + 0.5) - shownGentle(S - 0.5)));
    return <Numeral x={x} y={y} k={k} px={TYPE.HERO} value={vg} format={readoutFormat} rollBlur={blurG} tone="cream" enter={enter} />;
  }
  const v = readoutValue(S);
  const dv = Math.abs(readoutValue(S + 0.5) - readoutValue(S - 0.5));
  const blur = Math.min(10, dv * 9);
  if (v >= 10) return <ToneNumeral x={x} y={y} k={k} px={TYPE.HERO} text="$1B" dim={dim} />;
  if (v >= 9) {
    // the swap's blur follows its own visual speed (the smoothstep's slope x the value's rate)
    const u = v - 9;
    const swapBlur = Math.min(10, 6 * u * (1 - u) * dv * 9);
    return <RollSwap x={x} y={y} k={k} px={TYPE.HERO} from={readoutFormat(9)} to={readoutFormat(10)} roll={u} rollBlur={swapBlur} enter={enter} />;
  }
  return <Numeral x={x} y={y} k={k} px={TYPE.HERO} value={v} format={readoutFormat} rollBlur={blur} tone="cream" enter={enter} />;
};

// ===========================================================================
// THE WORLD — what both cuts render, at story time S (S_A).
// ===========================================================================
const enterAt = (t: number, t0: number) => clamp01((t - t0) / ENTER_F);

export const ActAStout: React.FC<{ S: number; billion?: Billion }> = ({ S, billion = "quick" }) => {
  const cam = camAt(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const f = S - S_JOIN; // cut-2 frame (<= 0 in cut 1)
  const inCut1 = f <= 0;
  const gentle = billion === "gentle";

  // --- the now pillar: cut 1 builds it, cut 2 keeps it ---------------------------------------------
  const tileIn = clamp01((S - C1.TILE_IN[0]) / (C1.TILE_IN[1] - C1.TILE_IN[0]));
  const barH = inCut1 ? barRise(S, billion) : NOW_BAR;
  const sliceH = inCut1 ? Math.min(pourH(S), barH) : NOW_SLICE;
  const edgeOn = inCut1 ? smoothstep((S - (C1.POUR[0] - 3)) / 5) * (1 - smoothstep((S - C1.EDGE_FADE) / ENTER_F)) : 0;
  const L = nowLockup(k, barH);

  // --- cut 1's lockup (exits at the top of cut 2) ----------------------------------------------------
  const out2 = inCut1 ? 0 : enterAt(f, C2.LABELS_OUT);
  const billionEnter = enterAt(S, gentle ? READOUT_IN_GENTLE : READOUT_IN);
  const billionDim = inCut1 ? 0 : smoothstep((f - C2.LABELS_OUT) / ENTER_F);
  const showHero = inCut1 || f < BILLION_GONE_F;

  // --- cut 2's chart ------------------------------------------------------------------------------------
  const head = AXIS_HEAD[Math.max(0, Math.min(AXIS_HEAD.length - 1, Math.round(f)))];
  const ret = returnProgress(Math.max(0, f));
  const bars: React.ReactNode[] = [];
  const chartLabels: React.ReactNode[] = [];
  if (!inCut1) {
    HIST.forEach((b, i) => {
      const rf = REVEAL_F[i];
      if (Number.isNaN(rf) || f <= rf) return;
      const rise = smoothstep((f - rf) / RISE_F);
      bars.push(<ChartBar key={b.year} x={b.x} baseY={TILE_TOP} h={b.h * rise} slice={b.slice * rise} k={k} amberBand={band} />);
      const en = enterAt(f, rf + LABEL_LAG_F);
      const valueY = TILE_TOP - b.h - SPACE.VALUE / k;
      if (i === 0) {
        // the start callout: SECONDARY on the hold, LABEL in the chart, about the bar's top-right corner
        const px = lerp(TYPE.SECONDARY, TYPE.LABEL, smoothstep(ret));
        chartLabels.push(<Numeral key="v0" x={b.x + GEO.HIST_BAR / 2} y={valueY} k={k} px={px} text={b.value} tone="cream" anchor="end" enter={en} />);
      } else {
        chartLabels.push(<Numeral key={`v${b.year}`} x={b.x} y={valueY} k={k} px={TYPE.LABEL} text={b.value} tone="creamLo" enter={en} />);
      }
      if (V2_YEAR_LABELS.includes(b.year)) {
        const yearY = TILE_TOP + (SPACE.AXIS + TYPE.LABEL * METRIC.fig) / k;
        chartLabels.push(<Numeral key={`y${b.year}`} x={b.x} y={yearY} k={k} px={TYPE.LABEL} text={`${b.year}`} tone="creamLo" enter={en} />);
      }
    });
  }
  const nowIn = inCut1 ? 0 : enterAt(f, NOW_LABELS_F);
  const nowIn2 = inCut1 ? 0 : enterAt(f, NOW_LABELS_F + 3);

  return (
    <StoutStage S={S} cam={cam} rest={CAM_REST} pool={(gentle ? POOL_TRACK_GENTLE : POOL_TRACK)[Math.max(0, Math.min(POOL_TRACK.length - 1, Math.round(S)))]}>
      {/* cut 2: the time axis, drawn leftward from the now tile's top-left corner */}
      {!inCut1 && AXIS_X1 - head > 0.5 ? <Rule x0={head} x1={AXIS_X1} y={TILE_TOP} k={k} /> : null}
      {bars}

      {/* the now pillar: tile (lifted while it enters), bar out of its slot, the slice */}
      <Pillar
        x={X_NOW}
        k={k}
        figure={{ kind: "mercedes" }}
        bar={barH}
        slice={sliceH}
        amberBand={band}
        enter={tileIn}
        lift={1 - easeOutCubic(tileIn)}
      />
      {inCut1 ? <PourEdge y={TILE_TOP - barH + pourH(S)} k={k} on={edgeOn} /> : null}

      {/* cut 1's one click: a light sweep across the amber slice as "30%" lands (cut 2 has no click) */}
      {inCut1 ? <LightSweep x={X_NOW - GEO.BAR / 2} y={TILE_TOP - NOW_BAR} w={GEO.BAR} h={NOW_SLICE} k={k} t={(S - C1.SWEEP) / SWEEP_F} on="amber" /> : null}

      {/* cut 2's figures */}
      {chartLabels}
      {!inCut1 ? (
        <>
          <Numeral x={X_NOW} y={TILE_TOP - NOW_BAR - SPACE.VALUE / k} k={k} px={TYPE.LABEL} text="$1B" tone="cream" enter={nowIn} />
          <Numeral
            x={X_NOW}
            y={TILE_TOP - NOW_BAR + NOW_SLICE / 2 + (TYPE.LABEL * METRIC.fig) / 2 / k}
            k={k}
            px={TYPE.LABEL}
            text="30%"
            tone="dark"
            enter={nowIn2}
          />
        </>
      ) : null}

      {/* cut 1's lockup: "$1B" (the odometer while the bar rises), REVENUE, "30%", PROFIT */}
      {showHero ? <HeroReadout x={X_NOW} y={L.billionY} k={k} S={S} enter={billionEnter} dim={billionDim} billion={billion} /> : null}
      <Label x={X_NOW} y={L.revenueY} k={k} text="revenue" tone="creamLo" enter={enterAt(S, gentle ? C1G.REVENUE_IN : C1.REVENUE_IN)} exit={out2} />
      <Numeral x={L.sideX} y={L.pctY} k={k} px={TYPE.SECONDARY} text="30%" tone="amber" anchor="start" glow enter={enterAt(S, C1.THIRTY_IN)} exit={out2} />
      <Label x={L.sideX} y={L.profitY} k={k} text="profit" tone="creamLo" anchor="start" enter={enterAt(S, C1.PROFIT_IN)} exit={out2} />
    </StoutStage>
  );
};
