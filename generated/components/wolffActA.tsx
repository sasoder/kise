import React from "react";
import {
  ACCENT,
  BAR_W,
  FONT_NUM,
  GROUND_Y,
  HALF_STEP,
  INK,
  INK_HI,
  INK_LO,
  KraftStage,
  LogoTile,
  MercedesTile,
  MoneyBar,
  NOW_LABEL_DEFAULTS,
  NOW_REV_PX,
  NOW_SLICE_PX,
  PX_PER_B,
  ProfitSlice,
  Readout,
  SOHNE,
  TILE_TOP,
  X_NOW,
  cameraTrack,
  clamp01,
  easeOut,
  lerp,
  nowLabelLayout,
  settleBump,
  smoothstep,
  strokeW,
  sz,
  typeSize,
} from "./wolffShared";
import type { Cam, Glide, LogoPath } from "./wolffShared";
import { iconShadow } from "./fieldShared";

// ---------------------------------------------------------------------------
// wolffActA — ACT A of the Toto Wolff clip: cut 1 `BillionInRevenue` (S_A
// 0-124) and cut 2 `BackInTheDay` (S_A 124-324) are ONE world on ONE story
// clock. Every track, the camera, the sway and the kraft drift are functions
// of S_A, so cut 2's f0 IS cut 1's f124 by construction. Both cuts render
// `ActA` and nothing else; the cut files only carry their header, schema and
// clock offset.
//
// DATA (out/wolff/briefs/data.md, director-checked):
//   "now" = Toto's own figures, $1B revenue / $300M profit (the clip).
//   History = Mercedes-Benz Grand Prix Ltd filings (Companies House), GBP M,
//   converted at the rate that makes Toto's $1B = GBP 748.3M (The Race, 10 Jun
//   2026): px = GBP_M x 160 / 748.3, for revenue AND profit. 2015 is an
//   operating loss (no slice); 2017-2021 profits are approximate (net-derived);
//   2019 revenue is interpolated 2018-2020. Sources per year in data.md.
//   The sport = Formula 1 revenue, USD B (Liberty Media filings; SEC exhibit
//   26 Feb 2026 for 2024/2025), 2018-2025, at the same 160 px per $1B.
// ---------------------------------------------------------------------------

export const DUR_1 = 125; // round((8.099 - 3.560) * 24) = 109, + 16
export const DUR_2 = 201; // round((20.480 - 12.759) * 24) = 185, + 16
export const S_JOIN = DUR_1 - 1; // 124: cut 2's f0 = cut 1's last frame
export const S_END = S_JOIN + DUR_2 - 1; // 324
/** cut-2 frame -> S_A */
export const c2 = (f: number) => S_JOIN + f;

// --- the time axis (cut 2) -----------------------------------------------------------
export const SLOT_PITCH = 84;
/** "now" is X_NOW (2026); 2025 at 456 ... 2015 at -384. */
export const slotX = (year: number) => X_NOW - (2026 - year) * SLOT_PITCH;
/** s = slots back from now: 0 = now, 1 = 2025 ... 11 = 2015. */
export const xOfS = (s: number) => X_NOW - s * SLOT_PITCH;
export const S_2015 = 11;

// Mercedes series in px, index s (0 = now ... 11 = 2015): data.md's px table.
export const MB_BAR = [160.0, 135.4, 136.0, 116.8, 101.5, 82.0, 76.0, 74.2, 72.4, 72.1, 61.9, 45.6];
export const MB_SLICE = [48.0, 35.6, 34.3, 24.3, 24.2, 15.0, 3.2, 3.4, 3.2, 3.2, 3.1, 0];
// Formula 1 revenue, $B, 2018 ... 2025.
export const F1_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
export const F1_REV = [1.83, 2.02, 1.15, 2.14, 2.57, 3.22, 3.411, 3.873];

// Monotone cubic (Fritsch-Carlson) through ys at integer abscissae: smooth
// through every year's value, never overshooting between two of them.
const pchip = (ys: number[]) => {
  const n = ys.length;
  const d = ys.slice(1).map((y, i) => y - ys[i]);
  const m = ys.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    return 2 / (1 / d[i - 1] + 1 / d[i]);
  });
  return (x: number) => {
    if (x <= 0) return ys[0];
    if (x >= n - 1) return ys[n - 1];
    const i = Math.floor(x);
    const t = x - i;
    const h00 = 2 * t * t * t - 3 * t * t + 1;
    const h10 = t * t * t - 2 * t * t + t;
    const h01 = -2 * t * t * t + 3 * t * t;
    const h11 = t * t * t - t * t;
    return h00 * ys[i] + h10 * m[i] + h01 * ys[i + 1] + h11 * m[i + 1];
  };
};
export const barOfS = pchip(MB_BAR);
export const sliceOfS = pchip(MB_SLICE);

// Monotone cubic through (x, y) keys with ZERO slope at both ends (a travel
// that leaves and arrives at rest), Fritsch-Carlson weights inside.
const travel = (X: number[], Y: number[]) => {
  const n = X.length;
  const h = X.slice(1).map((x, i) => x - X[i]);
  const d = Y.slice(1).map((y, i) => (y - Y[i]) / h[i]);
  const m = X.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= X[0]) return Y[0];
    if (x >= X[n - 1]) return Y[n - 1];
    let i = 0;
    while (x > X[i + 1]) i++;
    const t = (x - X[i]) / h[i];
    const h00 = 2 * t * t * t - 3 * t * t + 1;
    const h10 = t * t * t - 2 * t * t + t;
    const h01 = -2 * t * t * t + 3 * t * t;
    const h11 = t * t * t - t * t;
    return h00 * Y[i] + h10 * h[i] * m[i] + h01 * Y[i + 1] + h11 * h[i] * m[i + 1];
  };
};

// ===========================================================================
// CUT 1 — "Well, we're generating around a billion dollars in revenue and 30%
// profit margin."  ONE RISE AND ONE POUR. (S_A = cut-1 frame)
// ===========================================================================
export const C1 = {
  TILE_IN: [0, 10], // the tile slides up + fades in (well, we're)
  RISE: [12, 27], // the bar rises out of the tile (generating around a billion), lands 2 f before "billion" f29
  SETTLE: 8, // its zero-sloped settle, f27-35
  SETTLE_AMP: 2.5,
  REVENUE_IN: 34, // "revenue" slides up under "$1B", lands f46 ("revenue" f46)
  POUR: [56, 66], // the hairline descends to the 70 % line, amber behind it (and 30 ...), lands before "30" f68
  HAIR_FADE: 66, // the hairline becomes the slice's lower edge over 12 f
  THIRTY_IN: 58, // "30%" slides up right of the slice, lands f70 — THE CLICK f70-72
  PROFIT_IN: 72, // "profit" slides up under it, lands f84 ("profit" f84)
} as const;
export const ENTER_F = 12;
export const CLICK_F = 3;
const enterAt = (S: number, f0: number) => clamp01((S - f0) / ENTER_F);

export const barRiseH = (S: number) => {
  const [a, b] = C1.RISE;
  return NOW_REV_PX * smoothstep((S - a) / (b - a)) + settleBump(S - b, C1.SETTLE, C1.SETTLE_AMP);
};
/** The readout appears as the bar passes its first $100M (mechanism, not timer). */
export const READOUT_IN = (() => {
  for (let f = 0; f < 60; f += 0.01) if (barRiseH(f) >= NOW_REV_PX / 10) return Number(f.toFixed(2));
  return 15;
})();
export const readoutText = (h: number) => {
  if (h >= NOW_REV_PX - 0.5) return "$1B";
  const n = Math.max(1, Math.min(9, Math.floor((h / NOW_REV_PX) * 10 + 1e-6)));
  return `$${n}00M`;
};
export const pourH = (S: number) => NOW_SLICE_PX * smoothstep((S - C1.POUR[0]) / (C1.POUR[1] - C1.POUR[0]));

// ===========================================================================
// CUT 2 — "Back in the day it wasn't a billion and it wasn't 300 million. It
// was considerably less, because we're growing very strong, and the sport is
// still growing strong."  ONE TRIP THROUGH TIME. (cut-2 frames f; S = 124 + f)
// ===========================================================================
export const C2 = {
  LABELS_OUT: 2, // "revenue", "30%", "profit" exit as the bar leaves the tile (f2-14); "$1B" eases to INK_LO
  // THE REWIND: s 0 -> 11 (now -> 2015). Keys shape the speed so the height is
  // falling through "billion" (f33: s 2.5, between 2024 and 2023) and the slice
  // collapses through "300 million" (f52-58: s 5 -> 6, 2021 -> 2020).
  REW_F: [2, 33, 52, 58, 90],
  REW_S: [0, 2.5, 5, 6, S_2015],
  REW_SETTLE: [90, 8, 0.04], // zero-sloped settle into 2015 (0.04 slot = 3.4 px)
  YEAR_IN_S: 0.85, // the year readout enters as the bar nears 2025
  // THE REPLAY: s 11 -> 0, accelerating out of the held breath, landing f154
  // (revision 2: started 6 f earlier and landed 6 f later than v1 so the camera
  // can pull back from k 2.4 under the speed and |dv| caps).
  REPLAY: [99, 154],
  REPLAY_WARP: 1.25,
  LAND_SETTLE: [154, 8, 0.03],
  BILLION_HI: 150, // "$1B" eases back to INK_HI as the bar's top reaches it ...
  CLICK: 154, // ... THE ONE CLICK, half-step f154-156, on the landing
  RELABEL: [158, 160, 162], // "revenue", "30%", "profit" slide up again as the frame opens on them
  // THE SPORT: the F1 line draws head-led 2018 -> 2025, reaching 2025 at f172, on a
  // flat-topped speed profile (ramp in 20 %, ramp out 15 %) so the head is fast
  // but never past the 45 px/f cap.
  SPORT: [142, 172],
  SPORT_RAMP: [0.2, 0.15],
  STRAIN: [162, 14, 20], // the 2025 point strains upward: start f, amplitude world px, tau f
} as const;

const rewindS = travel([...C2.REW_F], [...C2.REW_S]);
/** The travelling bar's s at cut-2 frame f (0 = on the tile). */
export const barS = (f: number) => {
  const [r0, r1] = C2.REPLAY;
  if (f < r0) {
    const [s0, dur, amp] = C2.REW_SETTLE;
    return rewindS(f) + settleBump(f - s0, dur, amp);
  }
  const u = clamp01((f - r0) / (r1 - r0));
  const e = smoothstep(Math.pow(u, C2.REPLAY_WARP));
  const [l0, dur, amp] = C2.LAND_SETTLE;
  return S_2015 * (1 - e) - settleBump(f - l0, dur, amp);
};
/** First cut-2 frame (fractional) at which the replay passes slot j going right. */
export const depositF = (j: number) => {
  const [r0, r1] = C2.REPLAY;
  if (j >= S_2015) return r0;
  for (let f = r0; f <= r1; f += 0.01) if (barS(f) <= j) return f;
  return r1;
};
export const DEPOSIT_F = Array.from({ length: S_2015 + 1 }, (_, j) => (j === 0 ? Infinity : depositF(j)));
export const YEAR_IN_F = (() => {
  for (let f = 0; f < 90; f += 0.05) if (barS(f) >= C2.YEAR_IN_S) return Number(f.toFixed(2));
  return 20;
})();

// The sport line, in world px, 2018 ... 2025; its last point strains upward.
export const F1_PTS = F1_YEARS.map((y, i) => ({ x: slotX(y), y: TILE_TOP - F1_REV[i] * PX_PER_B }));
export const strainLift = (f: number) => {
  const [f0, amp, tau] = C2.STRAIN;
  return f <= f0 ? 0 : amp * (1 - Math.exp(-(f - f0) / tau));
};
const sportPts = (f: number) =>
  F1_PTS.map((p, i) => (i === F1_PTS.length - 1 ? { x: p.x, y: p.y - strainLift(f) } : p));
const polyLen = (pts: { x: number; y: number }[]) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return cum;
};
/** Drawn fraction of the sport line at cut-2 frame f (0..1): a flat-topped
 *  speed (smoothstep ramps of a and b of the window, level between). */
export const sportDraw = (f: number) => {
  const [f0, f1] = C2.SPORT;
  const [a, b] = C2.SPORT_RAMP;
  const u = clamp01((f - f0) / (f1 - f0));
  const ramp = (x: number) => x * x * x - (x * x * x * x) / 2; // integral of smoothstep, 0..1/2
  let P: number;
  if (u < a) P = a * ramp(u / a);
  else if (u <= 1 - b) P = a / 2 + (u - a);
  else P = a / 2 + (1 - a - b) + b * (0.5 - ramp((1 - u) / b));
  return P / (1 - a / 2 - b / 2);
};
/** The drawn sport line at cut-2 frame f: path points up to the head, and the head. */
export const sportLine = (f: number) => {
  const pts = sportPts(f);
  const cum = polyLen(pts);
  const L = cum[cum.length - 1] * sportDraw(f);
  const out = [pts[0]];
  let head = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] <= L) {
      out.push(pts[i]);
      head = pts[i];
    } else {
      const t = (L - cum[i - 1]) / (cum[i] - cum[i - 1]);
      head = { x: lerp(pts[i - 1].x, pts[i].x, t), y: lerp(pts[i - 1].y, pts[i].y, t) };
      out.push(head);
      break;
    }
  }
  return { pts: out, head, drawn: sportDraw(f) };
};

// ===========================================================================
// THE CAMERA — one track for the act on S_A: glides superposed (C1), then the
// house damper. `look` is the content centre; the camera centre is look +
// CAM_LIFT / k (content at screen y ~835). PRE frames of pre-roll so the
// opening creep is already moving on f0.
// ===========================================================================
export const CAM_PRE = 30;
export const CAM_START: Cam = { x: 548, y: 1186, k: 2.24 };
export const CAM_GLIDES: Glide[] = [
  // cut 1
  { f0: -30, f1: 22, dy: -4, k: 2.3, warp: 1 }, // the creep already running on f0 (tile low, room above)
  { f0: 8, f1: 38, dx: 12, dy: -30, k: 2.0, warp: 0.9 }, // rides the top up and eases back (generating ... billion)
  { f0: 32, f1: 92, dy: -12, k: 2.1, warp: 1 }, // creeps toward the bar's top third (dollars in revenue ... 30%)
  { f0: 80, f1: 150, dy: -8, k: 2.17, warp: 1 }, // the creep carrying on and decaying through the hold
  // cut 2 (S = 124 + f). Revision 2 (director): the bar is the subject. The
  // camera rides it at k 2.2 through the rewind (bar right of centre, the $1B
  // line above it), eases off first so the bar coasts into the middle of the
  // frame as it settles, creeps in to k 2.4 on 2015, then the replay is one
  // real pull-back to k 1.1, and the ending lifts to k 0.95 with the look
  // shifted right onto the sport and the now column. The three ride glides
  // were fitted (least squares on the damped track) so the pan never dips or
  // reverses; every amplitude points the same way.
  { f0: c2(0), f1: c2(30), k: 2.2, warp: 1 }, // eases in to ride the bar (back in the day)
  { f0: c2(0), f1: c2(38), dx: -300, warp: 1 }, // gets ahead of it as it leaves the tile
  { f0: c2(26), f1: c2(74), dx: -447, warp: 1 }, // rides it left (wasn't a billion ... 300 million)
  { f0: c2(56), f1: c2(86), dx: -210, warp: 1 }, // eases off first, so the bar coasts into the middle (it was)
  { f0: c2(63), f1: c2(90), k: 2.4, warp: 1 }, // creeps in on 2015 as the bar settles: the tiny bar, the long gap up to $1B (it was considerably); still ~f93-100
  { f0: c2(97), f1: c2(149), k: 1.111, warp: 0.86 }, // the replay's pull-back, front-loaded while the bar is still slow (less, because we're growing very strong)
  { f0: c2(105), f1: c2(160), dx: 683, warp: 0.99 }, // the pan that follows the bar right, back-loaded to where k is already low
  { f0: c2(120), f1: c2(194), dx: -26.5, dy: -238, k: 0.95, warp: 0.9 }, // lifts onto the sport and the now column, the oldest bars let go off the left (and the sport is still growing strong)
];
export const CAM_TRACK: Cam[] = cameraTrack(
  { x: CAM_START.x, y: CAM_START.y, k: CAM_START.k },
  CAM_GLIDES.map((g) => ({ ...g, f0: g.f0 + CAM_PRE, f1: g.f1 + CAM_PRE })),
  S_END + CAM_PRE + 4,
).slice(CAM_PRE);
export const camAt = (S: number): Cam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(S)))];
export const CAM_REST: Cam = CAM_TRACK[0];
/** Cut 1's resolved camera (S_A 124) — the look cut 3 opens on. */
export const CAM_NOW_END: Cam = CAM_TRACK[S_JOIN];

// ===========================================================================
// THE F1 BADGE — LogoTile, 72 world px. The swap is ONE constant: set F1_LOGO
// to the logo's knock-out paths + viewBox when the director sends the SVG.
// Until then, the placeholder: "F1" in Söhne Halbfett, skewed -12 deg.
// ===========================================================================
export type F1Logo = { paths: LogoPath[]; viewBox: string; fillRule?: "nonzero" | "evenodd" };
export const F1_LOGO = null as F1Logo | null;
export const BADGE = 72;

const F1Placeholder: React.FC<{ size: number }> = ({ size }) => {
  const base = size / 2 + size * 0.22;
  return (
    <text
      x={size / 2}
      y={base}
      fontFamily={FONT_NUM}
      fontWeight={600}
      fontSize={size * 0.6}
      textAnchor="middle"
      fill="#000"
      transform={`skewX(-12) translate(${(base * Math.tan((12 * Math.PI) / 180)).toFixed(3)} 0)`}
    >
      F1
    </text>
  );
};

export const F1Badge: React.FC<{ x: number; y: number; k: number; opacity?: number }> = ({ x, y, k, opacity = INK_HI }) =>
  F1_LOGO ? (
    <LogoTile x={x} y={y} k={k} size={BADGE} paths={F1_LOGO.paths} viewBox={F1_LOGO.viewBox} fillRule={F1_LOGO.fillRule} opacity={opacity} contact={false} />
  ) : (
    <LogoTile x={x} y={y} k={k} size={BADGE} opacity={opacity} contact={false} figure={<F1Placeholder size={BADGE} />} />
  );

// --- per-frame tables (built once) ----------------------------------------------------
/** The axis's left end: it draws leftward just ahead of the travelling bar and never retracts. */
export const AXIS_LEAD = 16;
export const AXIS_X0 = X_NOW - 48; // the tile's top-left corner
export const AXIS_LEFT: number[] = (() => {
  const out: number[] = [];
  let m = AXIS_X0;
  for (let S = 0; S <= S_END + 1; S++) {
    if (S >= S_JOIN) m = Math.min(m, xOfS(barS(S - S_JOIN)) - BAR_W / 2 - AXIS_LEAD);
    out.push(m);
  }
  return out;
})();

// ===========================================================================
// THE WORLD — what both cuts render, at story time S (S_A).
// ===========================================================================
const DASH_PX: [number, number] = [11, 9];

export const ActA: React.FC<{ S: number }> = ({ S }) => {
  const cam = camAt(S);
  const k = cam.k;
  const sw = strokeW(k);
  const icon = iconShadow(k);
  const f = S - S_JOIN; // cut-2 frame (negative during cut 1)
  const L = nowLabelLayout(k);

  // --- cut 1: tile, rise, pour --------------------------------------------------------
  const tileE = easeOut((S - C1.TILE_IN[0]) / (C1.TILE_IN[1] - C1.TILE_IN[0]));
  const tileDy = ((1 - tileE) * 24) / k;
  const inCut1 = f <= 0;
  const s = inCut1 ? 0 : barS(f);
  const barX = xOfS(Math.max(-0.2, s));
  const barH = inCut1 ? barRiseH(S) : barOfS(Math.max(0, s));
  const sliceH = inCut1 ? Math.min(pourH(S), barH) : sliceOfS(Math.max(0, s));

  // --- labels --------------------------------------------------------------------------
  // "$1B": the riding readout in cut 1; in cut 2 it stays at the line's right end,
  // INK_HI -> INK_LO as the bar leaves, back to INK_HI (+ the click) as it lands.
  const riding = nowLabelLayout(k, Math.max(barH, 0));
  const billionText = inCut1 ? readoutText(barH) : "$1B";
  const billionEnter = inCut1 ? enterAt(S, READOUT_IN) : 1;
  const billionY = inCut1 ? riding.billion.y : L.billion.y;
  const billionOp = inCut1
    ? INK_HI
    : lerp(lerp(INK_HI, INK_LO, smoothstep((f - C2.LABELS_OUT) / ENTER_F)), INK_HI, smoothstep((f - C2.BILLION_HI) / ENTER_F));
  const billionColor = !inCut1 && f >= C2.CLICK && f < C2.CLICK + CLICK_F ? HALF_STEP : INK;
  // "revenue", "30%", "profit": enter in cut 1, exit at the rewind, re-enter on landing
  const labelEnter = (cut1In: number, relabel: number) =>
    inCut1 ? enterAt(S, cut1In) : f < C2.REPLAY[0] ? 1 - enterAt(f, C2.LABELS_OUT) : enterAt(f, relabel);
  const revenueE = labelEnter(C1.REVENUE_IN, C2.RELABEL[0]);
  const thirtyE = labelEnter(C1.THIRTY_IN, C2.RELABEL[1]);
  const profitE = labelEnter(C1.PROFIT_IN, C2.RELABEL[2]);
  const thirtyLand = C1.THIRTY_IN + ENTER_F;
  const thirtyColor = inCut1 && S >= thirtyLand && S < thirtyLand + CLICK_F ? HALF_STEP : ACCENT;

  // --- the hairline (cut 1's pour) --------------------------------------------------------
  const hairOn = smoothstep((S - (C1.POUR[0] - 3)) / 5) * (1 - smoothstep((S - C1.HAIR_FADE) / ENTER_F));
  const barTop = TILE_TOP - barH;
  const hairY = barTop + pourH(S);
  const hairOver = sz(9, k);

  // --- cut 2: deposits, dashed level, year readout ------------------------------------
  const deposits: React.ReactNode[] = [];
  if (!inCut1) {
    for (let j = S_2015; j >= 1; j--) {
      const fd = DEPOSIT_F[j];
      if (f < fd) continue;
      const op = lerp(INK_HI, INK_LO, smoothstep((f - fd) / ENTER_F));
      deposits.push(
        <g key={j}>
          <MoneyBar x={xOfS(j)} baseY={TILE_TOP} h={MB_BAR[j]} k={k} opacity={op} />
          <ProfitSlice x={xOfS(j)} topY={TILE_TOP - MB_BAR[j]} h={MB_SLICE[j]} />
        </g>,
      );
    }
  }
  const levelY = TILE_TOP - NOW_REV_PX;
  const gap = NOW_REV_PX - barH;
  const levelOp = inCut1 ? 0 : INK_LO * smoothstep(gap / 10);
  const yearF = f - YEAR_IN_F;
  const yearS = f >= C2.REPLAY[0] ? S_2015 : Math.max(1, Math.min(S_2015, Math.floor(s + 1e-6)));
  const yearX = f >= C2.REPLAY[0] ? xOfS(S_2015) : barX;
  const fy = typeSize("year", k);
  const yearY = TILE_TOP + sz(14, k) + SOHNE.fig * fy;

  // --- the sport ------------------------------------------------------------------------------
  const sport = inCut1 ? null : sportLine(f);
  const badgeE = inCut1 ? 0 : easeOut((f - C2.SPORT[0]) / 10);

  return (
    <KraftStage S={S} cam={cam} rest={CAM_REST}>
      {/* the time axis along TILE_TOP, drawn leftward from the tile's top-left corner */}
      {!inCut1 && AXIS_LEFT[Math.round(S)] < AXIS_X0 - 0.5 ? (
        <line
          x1={AXIS_X0}
          y1={TILE_TOP}
          x2={AXIS_LEFT[Math.round(S)]}
          y2={TILE_TOP}
          stroke={INK}
          strokeOpacity={INK_LO}
          strokeWidth={sw}
          strokeLinecap="square"
          style={{ filter: icon }}
        />
      ) : null}

      <MercedesTile x={X_NOW} y={GROUND_Y + tileDy} k={k} opacity={INK_HI * tileE} />
      {deposits}
      <MoneyBar x={barX} baseY={TILE_TOP} h={barH} k={k} />
      <ProfitSlice x={barX} topY={TILE_TOP - barH} h={Math.min(sliceH, barH)} />

      {hairOn > 0.001 ? (
        <line
          x1={X_NOW - BAR_W / 2 - hairOver}
          x2={X_NOW + BAR_W / 2 + hairOver}
          y1={hairY}
          y2={hairY}
          stroke={INK}
          strokeOpacity={hairOn}
          strokeWidth={sw}
          strokeLinecap="square"
          style={{ filter: icon }}
        />
      ) : null}

      {levelOp > 0.001 ? (
        // the dash pattern starts at the BAR end, so the dashes travel with the bar
        // the line extends with: world-anchored dashes alias (0.5-1.5 periods per
        // frame under the k 2.2 ride); bar-anchored they stay <= 0.35 period/f
        <line
          x1={barX}
          y1={levelY}
          x2={X_NOW}
          y2={levelY}
          stroke={INK}
          strokeOpacity={levelOp}
          strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${sz(DASH_PX[0], k).toFixed(3)} ${sz(DASH_PX[1], k).toFixed(3)}`}
          style={{ filter: icon }}
        />
      ) : null}

      <Readout x={X_NOW} y={billionY} text={billionText} kind="num" k={k} enter={billionEnter} color={billionColor} opacity={billionOp} />
      <Readout x={L.revenue.x} y={L.revenue.y} text={NOW_LABEL_DEFAULTS.revenue.text} kind="word" k={k} enter={revenueE} opacity={INK_LO} />
      <Readout x={L.thirty.x} y={L.thirty.y} text={NOW_LABEL_DEFAULTS.thirty.text} kind="num" k={k} enter={thirtyE} color={thirtyColor} opacity={1} anchor="start" />
      <Readout x={L.profit.x} y={L.profit.y} text={NOW_LABEL_DEFAULTS.profit.text} kind="word" k={k} enter={profitE} opacity={INK_LO} anchor="start" />

      {!inCut1 && yearF > 0 ? (
        <Readout x={yearX} y={yearY} text={`${2026 - yearS}`} kind="year" k={k} enter={yearF / ENTER_F} opacity={INK_LO} />
      ) : null}

      {sport && sport.drawn > 0.0005 ? (
        <g>
          <path
            d={sport.pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ")}
            fill="none"
            stroke={INK}
            strokeOpacity={INK_HI}
            strokeWidth={sw}
            strokeLinecap="square"
            strokeLinejoin="miter"
            style={{ filter: icon }}
          />
          <F1Badge
            x={sport.head.x}
            y={sport.head.y - sz(12, k) + ((1 - badgeE) * 24) / k}
            k={k}
            opacity={INK_HI * badgeE}
          />
        </g>
      ) : null}
    </KraftStage>
  );
};
