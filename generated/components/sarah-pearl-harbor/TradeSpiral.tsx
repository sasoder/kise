import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF, clamp01, smoothstep, sway } from "../kits/dwarkesh/fieldShared";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// TradeSpiral: Sarah Paine, "How the Depression pushed Japan to Pearl Harbor"
// (Dwarkesh map style, no map). Sequence 00:00:15:18-00:00:18:14.
//   "...and it's going to really hurt trade globally. It won't help us."
//
// CHECK LINE: after this cut the viewer can say "world trade didn't just dip,
// it spiralled down to a third of its size."
//
// THE PICTURE: Kindleberger's "contracting spiral of world trade" (The World
// in Depression 1929-1939, 1973, p.172): total imports of 75 countries,
// monthly, millions of old US gold dollars, Jan 1929 - Mar 1933 (League of
// Nations Monthly Bulletin of Statistics, Feb 1934, p.51). Polar: January at
// the top, clockwise, radius proportional to the value from the centre; the
// line is a Catmull-Rom through the monthly points in polar space. Faint
// reference rings at 1000 / 2000 / 3000 and 12 spokes; no orange (orange =
// Japan in this clip). The TRADE DISC is one smooth body with the 1929 loop's
// shape (faint cream wash + engraved hatch, a thin crisp cream edge), scaled
// evenly about the spiral's centre by the 12-month rolling mean of the value
// the pen has reached over the 1929 mean: 1.00 on f0, 0.377 at Mar 1933. The
// line is the record behind it: every drawn loop at ~0.55, the 1929 ring a
// touch brighter (~0.8) as the reference, the pen's current stretch bright.
//
// THE MOTION: frame 0 already shows the whole 1929 loop with the disc filling
// it, the line's end at Jan 1930 and "1929" set at the top. From f1 the pen
// spirals inward at constant angular speed (eased only at its two ends) to
// Mar 1933, arriving f55; its growing end is a short bright taper (as long as
// one frame's travel, so the fast outer turns do not strobe) and the stretch
// behind it settles into the record over ~4 months. The disc contracts all
// round at once, smoothly, with the pen's progress, and over f40-58 its outline
// morphs onto the last loop's own shape so at rest its edge sits exactly on the
// final loop. WORLD TRADE slides up onto
// "trade" (f23); "1933" slides up inside the disc as the pen arrives. The
// camera pushes in about the spiral's centre on a damped keyed track, capped
// so the 1929 ring keeps >= 40 px of margin each side through f80, decaying
// into a slow creep; in the hold a faint highlight runs along the last loop
// into the line's end.
//
// SPOKEN (local frames, +-3): and@1 it's@5 going@9 to@12 really@15 hurt@18
//   trade@23 globally@37 . It@44 won't@50 help@56 us@60 . (cut at 68)
// DURATION = 68 (the cut back to the speaker) + 12 (living tail) = 80.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 80;
const W = 1080;
const H = 1920;

const LAND = "#3F3428";
const INK = "#E9DDBF";
const DARK = "#17120D";
const SHINE = "#FFFDF4";

export const schema = z.object({
  ink: z.string(),
  backdropSrc: z.string(),
  mottleSrc: z.string(),
  grainSrc: z.string(),
  vignette: z.number(),
  labels: z.object({ title: z.string(), start: z.string(), end: z.string() }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  mottleSrc: "manchuria/mottle.png",
  grainSrc: "manchuria/grain.png",
  vignette: 0.34,
  labels: { title: "WORLD TRADE", start: "1929", end: "1933" },
});

// ---------------------------------------------------------------------------
// THE DATA, exactly as Kindleberger p.172 (Jan 1929 .. Mar 1933, 51 months).
// ---------------------------------------------------------------------------
export const IMPORTS = [
  2997.7, 2630.3, 2814.8, 3039.1, 2957.6, 2791.0, 2813.9, 2818.5, 2773.9, 2966.8, 2888.8, 2793.9, // 1929
  2738.9, 2454.6, 2563.9, 2449.9, 2447.0, 2325.7, 2189.5, 2137.7, 2164.8, 2300.8, 2051.3, 2095.9, // 1930
  1838.9, 1700.5, 1889.1, 1796.4, 1764.3, 1732.3, 1679.6, 1585.9, 1572.1, 1556.3, 1470.0, 1426.9, // 1931
  1206.0, 1186.7, 1230.4, 1212.8, 1150.5, 1144.7, 993.7, 1004.6, 1029.6, 1090.4, 1093.3, 1121.2, // 1932
  992.4, 944.0, 1056.9, // 1933
];
const N = IMPORTS.length;
const M_START = 12; // Jan 1930: where the line ends on frame 0
const M_END = N - 1; // Mar 1933

// ---------------------------------------------------------------------------
// GEOMETRY (world px == screen px at k 1). The spiral's centre is the pivot.
// ---------------------------------------------------------------------------
const SCALE = 0.14; // world px per million gold dollars: 3000 -> 420 px (the 1929 ring ~79% of the width on f0)
const SPM = 16; // path samples per month
const LINE_W = 7; // the trade line, world px
const DISC_EDGE_W = 2.2; // the disc's crisp cream edge, world px
const CASE_W = LINE_W + 4.5; // its dark casing
const CY = 860;

/** the value at fractional month m: uniform Catmull-Rom through the monthly points */
const valueAt = (m: number) => {
  const i = Math.max(0, Math.min(N - 2, Math.floor(m)));
  const t = m - i;
  const v = (j: number) => IMPORTS[Math.max(0, Math.min(N - 1, j))];
  const p0 = v(i - 1);
  const p1 = v(i);
  const p2 = v(i + 1);
  const p3 = v(i + 2);
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
};
/** offset from the centre of fractional month m: January at the top, clockwise */
const offsetAt = (m: number): [number, number] => {
  const r = valueAt(m) * SCALE;
  const a = (m * Math.PI) / 6;
  return [r * Math.sin(a), -r * Math.cos(a)];
};

const SAMPLES = (N - 1) * SPM;
const OFFS = Array.from({ length: SAMPLES + 1 }, (_, j) => offsetAt(j / SPM));
// centre the spiral's real width (April 1929 reaches further right than October left)
const X_MIN = Math.min(...OFFS.map((o) => o[0]));
const X_MAX = Math.max(...OFFS.map((o) => o[0]));
const CX = 540 - (X_MIN + X_MAX) / 2;
const HALF_W = (X_MAX - X_MIN) / 2;

const pointAt = (m: number): [number, number] => {
  const [dx, dy] = offsetAt(m);
  return [CX + dx, CY + dy];
};
const PTS: [number, number][] = OFFS.map(([dx, dy]) => [CX + dx, CY + dy]);
const ARC: number[] = [0];
for (let j = 1; j <= SAMPLES; j++) ARC.push(ARC[j - 1] + Math.hypot(PTS[j][0] - PTS[j - 1][0], PTS[j][1] - PTS[j - 1][1]));
const TOTAL = ARC[SAMPLES];
const SPIRAL_D = PTS.map((p, j) => `${j === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("");
/** arc length from Jan 1929 to fractional month m */
const arcAt = (m: number) => {
  const x = Math.max(0, Math.min(SAMPLES, m * SPM));
  const j = Math.min(SAMPLES - 1, Math.floor(x));
  return ARC[j] + (ARC[j + 1] - ARC[j]) * (x - j);
};
/** the point at arc length a */
const pointAtArc = (a: number): [number, number] => {
  const s = Math.max(0, Math.min(TOTAL, a));
  let lo = 0;
  let hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ARC[mid] <= s) lo = mid;
    else hi = mid;
  }
  const u = (s - ARC[lo]) / (ARC[hi] - ARC[lo] || 1);
  return [PTS[lo][0] + (PTS[hi][0] - PTS[lo][0]) * u, PTS[lo][1] + (PTS[hi][1] - PTS[lo][1]) * u];
};
const pathOf = (pts: [number, number][], close = false) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("") + (close ? "Z" : "");

// THE TRADE DISC: one smooth body with the 1929 loop's shape (a closed,
// periodic Catmull-Rom through Jan..Dec 1929), scaled uniformly about the
// spiral's centre by s = (12-month rolling mean of the value the pen has
// reached) / (the same mean at Jan 1930, i.e. the 1929 mean ~2857). The rolling
// mean is the exact integral of the drawn curve over the last twelve months, so
// s is smooth in the pen's (eased) month and falls monotonically, 1.00 -> 0.377.
// Over f40-58 the outline morphs (eased, per angle, radius by radius) from the
// scaled 1929 shape onto the last loop's own shape, so at rest the disc's edge
// sits exactly on the final loop: the drawn curve Apr 1932 -> Mar 1933, closed
// across the 30 deg gap (Mar -> Apr) by a cubic Hermite that matches the
// curve's value and slope at both ends.
const DISC_N = 12 * SPM; // same angular samples as the line
const DISC_ANG = Array.from({ length: DISC_N }, (_, i) => ((12 * i) / DISC_N) * (Math.PI / 6));
/** radius (world px at scale 1) of the closed 1929 shape at month-slot u (0 = Jan) */
const shape1929 = (u: number) => {
  const k = Math.floor(u);
  const t = u - k;
  const v = (j: number) => IMPORTS[((j % 12) + 12) % 12];
  const p0 = v(k - 1);
  const p1 = v(k);
  const p2 = v(k + 1);
  const p3 = v(k + 2);
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t) * SCALE;
};
/** radius (world px) of the last loop's own closed shape at month-slot u */
const shapeLastLoop = (u: number) => {
  if (u >= 3) return valueAt(36 + u) * SCALE; // Apr..Dec 1932
  if (u <= 2) return valueAt(48 + u) * SCALE; // Jan..Mar 1933
  const t = u - 2; // the closure, Mar 1933 -> Apr 1932
  const p0 = IMPORTS[50];
  const p1 = IMPORTS[39];
  const m0 = 0.5 * (IMPORTS[50] - IMPORTS[49]); // the drawn curve's slope at its end
  const m1 = 0.5 * (IMPORTS[40] - IMPORTS[38]); // and at Apr 1932
  const t2 = t * t;
  const t3 = t2 * t;
  return ((2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1) * SCALE;
};
const R_1929 = DISC_ANG.map((_, i) => shape1929((12 * i) / DISC_N));
const R_LAST = DISC_ANG.map((_, i) => shapeLastLoop((12 * i) / DISC_N));
const MORPH = [40, 58] as const;
const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
/** the disc outline at scale sc and morph w, in the disc group's own units (the group scales by sc) */
const discOutline = (sc: number, w: number) =>
  pathOf(
    DISC_ANG.map((a, i) => {
      const r = (sc * R_1929[i] + (R_LAST[i] - sc * R_1929[i]) * w) / sc;
      return [CX + r * Math.sin(a), CY - r * Math.cos(a)] as [number, number];
    }),
    true,
  );
// cumulative integral of the curve's value, per path sample (trapezoid)
const CUM: number[] = [0];
for (let j = 1; j <= SAMPLES; j++) CUM.push(CUM[j - 1] + (valueAt((j - 1) / SPM) + valueAt(j / SPM)) / (2 * SPM));
const cumAt = (m: number) => {
  const x = Math.max(0, Math.min(SAMPLES, m * SPM));
  const j = Math.min(SAMPLES - 1, Math.floor(x));
  return CUM[j] + (CUM[j + 1] - CUM[j]) * (x - j);
};
const rollingMean = (m: number) => (cumAt(m) - cumAt(m - 12)) / 12;
const MEAN_1929 = rollingMean(12);
/** the disc's scale when the pen has reached month m */
export const discScale = (m: number) => rollingMean(m) / MEAN_1929;

// THE RECORD: every drawn loop at a moderate tone, the 1929 ring a touch
// brighter as the reference, the pen's current stretch bright. Tones are
// opaque mixes toward the page (no alpha), so overlapping pieces leave no seams.
const RECORD_TONE = "#9A8E74"; // cream at ~0.55 over the umber page
const REF_TONE = "#C9BEA0"; // the 1929 ring, ~0.8
const BRIGHT_HOLD = 1.0; // months behind the pen at full brightness
const BRIGHT_FADE = 3.0; // months over which the stretch settles into the record
const REF_D = pathOf(PTS.slice(0, 12 * SPM + 1));
/** month at arc length a */
const monthAtArc = (a: number) => {
  const s = Math.max(0, Math.min(TOTAL, a));
  let lo = 0;
  let hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ARC[mid] <= s) lo = mid;
    else hi = mid;
  }
  return (lo + (s - ARC[lo]) / (ARC[hi] - ARC[lo] || 1)) / SPM;
};
/** the base tone at month-position x (the 1929 ring blends into the record over the first half-month of 1930) */
const baseTone = (x: number) => mix(REF_TONE, RECORD_TONE, smoothstep((x - 12) / 0.5));
const brightness = (age: number) => 1 - smoothstep((age - BRIGHT_HOLD) / BRIGHT_FADE);
/** the bright current stretch: quarter-month pieces from the fade's end up to month mBody, coloured by age */
const currentStretch = (m: number, mBody: number) => {
  const pieces: { d: string; c: string }[] = [];
  const from = Math.max(0, m - BRIGHT_HOLD - BRIGHT_FADE);
  for (let x0 = from; x0 < mBody - 1e-6; x0 += 0.25) {
    const x1 = Math.min(mBody, x0 + 0.25 + 1 / SPM); // one sample of overlap with the next piece
    const pts: [number, number][] = [pointAt(x0)];
    for (let j = Math.ceil(x0 * SPM + 1e-6); j < x1 * SPM; j++) pts.push(PTS[j]);
    pts.push(pointAt(x1));
    const xm = Math.min(mBody, x0 + 0.125);
    pieces.push({ d: pathOf(pts), c: mix(baseTone(xm), INK, brightness(m - xm)) });
  }
  return pieces;
};
/** review helper: the pen's screen position on frame f (no sway) */
export const penScreen = (f: number) => {
  const [x, y] = pointAt(penMonth(f));
  const k = camK(f);
  return { x: CX + (x - CX) * k, y: CY + (y - CY) * k };
};

// reference rings and spokes
const RINGS = [1000, 2000, 3000];
const SPOKE_IN = 1000 * SCALE;
const SPOKE_OUT = 3100 * SCALE;
const SPOKES_D = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  const s = Math.sin(a);
  const c = Math.cos(a);
  return `M${(CX + SPOKE_IN * s).toFixed(2)},${(CY - SPOKE_IN * c).toFixed(2)}L${(CX + SPOKE_OUT * s).toFixed(2)},${(CY - SPOKE_OUT * c).toFixed(2)}`;
}).join("");

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
// The pen: constant angular speed, eased in over f1-7 and out over f45-55
// (velocity ramps are smoothsteps; position is their exact integral).
const PEN = { a0: 1, a1: 7, d0: 45, d1: 55 };
const rampInt = (u: number) => u * u * u - (u * u * u * u) / 2; // integral of smoothstep, 0..1 -> 0..0.5
const PEN_SPAN = PEN.d0 - PEN.a1 + (PEN.a1 - PEN.a0) / 2 + (PEN.d1 - PEN.d0) / 2;
export const penMonth = (f: number) => {
  let p: number;
  if (f <= PEN.a0) p = 0;
  else if (f <= PEN.a1) p = (PEN.a1 - PEN.a0) * rampInt((f - PEN.a0) / (PEN.a1 - PEN.a0));
  else if (f <= PEN.d0) p = (PEN.a1 - PEN.a0) / 2 + (f - PEN.a1);
  else if (f <= PEN.d1) {
    const L = PEN.d1 - PEN.d0;
    const u = (f - PEN.d0) / L;
    p = (PEN.a1 - PEN.a0) / 2 + (PEN.d0 - PEN.a1) + L * (u - rampInt(u));
  } else p = PEN_SPAN;
  return M_START + ((M_END - M_START) * p) / PEN_SPAN;
};
/** first frame the pen has reached month m */
const frameAtMonth = (m: number) => {
  for (let f = 0; f <= DURATION; f++) if (penMonth(f) >= m - 1e-6) return f;
  return DURATION;
};
export const F_END = frameAtMonth(M_END); // the pen arrives at Mar 1933
const T = {
  title: 14, // WORLD TRADE: slide f14-24, landing on "trade" f23
  endTag: F_END - 9, // "1933" starts its slide as the pen enters its last quarter-turn
  shine: [F_END, DURATION - 1] as const,
  shineFrom: M_END - 12, // the last loop, Mar 1932 -> Mar 1933
};
const TIP_PER_TRAVEL = 0.85; // taper length / this frame's travel
const TIP_MAX = 120;

// The camera: k only (the pivot is the spiral's centre), keys in log space
// through a monotone cubic, then the house damped follow (pre-rolled, so frame
// 0 is already in motion). K_MAX keeps the 1929 ring (+ casing, + sway) >= 40
// px inside each side of the frame; the follow trails its keys, so the camera
// itself stays below K_MAX through f80.
export const K_MAX = (W / 2 - 40 - 3) / (HALF_W + CASE_W / 2);
const LOGK_MAX = Math.log(K_MAX);
type Key = { f: number; q: number }; // q = fraction of log K_MAX
const CAM_KEYS: Key[] = [
  { f: 0, q: 0.047 }, // the follow trails ~4 f: the camera itself is at k ~1.00 on frame 0
  { f: 16, q: 0.18 },
  { f: 34, q: 0.52 },
  { f: 52, q: 0.83 },
  { f: 80, q: 1 },
];
const pchip = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};
const CAM_LOGK: number[] = (() => {
  const target = pchip(
    CAM_KEYS.map((q) => q.f),
    CAM_KEYS.map((q) => q.q * LOGK_MAX),
  );
  const PRE = 60;
  let s = target(-PRE);
  let v = 0;
  for (let f = -PRE + 1; f <= 0; f++) {
    v += (target(f) - s) * CAM_STIFF - v * CAM_DAMP;
    s += v;
  }
  const out = [s];
  for (let f = 1; f <= DURATION + 1; f++) {
    v += (target(f) - s) * CAM_STIFF - v * CAM_DAMP;
    s += v;
    out.push(Math.min(s, LOGK_MAX));
  }
  return out;
})();
// The disc's scale per frame: discScale at the pen's month, then a gaussian
// smoothing in time (sigma 3.5 f) so the month-to-month swings in the data do
// not make the contraction surge and stall; held at 1 before f0 and at its
// Mar 1933 value after the pen stops.
export const DISC_SCALE: number[] = (() => {
  const raw = (f: number) => discScale(penMonth(Math.max(0, Math.min(DURATION, f))));
  const SIG = 3.5;
  const R = 10;
  const out: number[] = [];
  for (let f = 0; f <= DURATION; f++) {
    let acc = 0;
    let wsum = 0;
    for (let d = -R; d <= R; d++) {
      const w = Math.exp(-(d * d) / (2 * SIG * SIG));
      acc += w * raw(f + d);
      wsum += w;
    }
    out.push(acc / wsum);
  }
  return out;
})();
export const camK = (f: number) => Math.exp(CAM_LOGK[Math.max(0, Math.min(CAM_LOGK.length - 1, Math.round(f)))]);

// ---------------------------------------------------------------------------
const slideIn = (frame: number, appear: number) => {
  const u = clamp01((frame - appear) / 10);
  return { op: smoothstep(u), dy: 24 * Math.pow(1 - u, 3) };
};

/** a tapered ribbon along the line from arc a to arc b (width w0 at a, ~0 at b) */
const taperPath = (a: number, b: number, w0: number) => {
  const n = 14;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = a + (b - a) * t;
    const p = pointAtArc(s);
    const q0 = pointAtArc(s - 1.5);
    const q1 = pointAtArc(s + 1.5);
    const len = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
    const nx = -(q1[1] - q0[1]) / len;
    const ny = (q1[0] - q0[0]) / len;
    const hw = (Math.max(0.5, w0 * Math.pow(1 - t, 0.6))) / 2;
    left.push([p[0] + nx * hw, p[1] + ny * hw]);
    right.push([p[0] - nx * hw, p[1] - ny * hw]);
  }
  return pathOf([...left, ...right.reverse()], true);
};

const TradeSpiral: React.FC<Props> = ({ ink, backdropSrc, mottleSrc, grainSrc, vignette, labels }) => {
  const frame = useCurrentFrame();

  const k = camK(frame);
  const drift = sway(frame);
  const tx = CX - CX * k + drift.dx * 0.6;
  const ty = CY - CY * k + drift.dy * 0.5;
  const camSvg = `translate(${tx} ${ty}) scale(${k})`;
  const camCss = `translate(${tx}px, ${ty}px) scale(${k})`;

  // the pen and its tapered tip (as long as this frame's travel)
  const m = penMonth(frame);
  const s = arcAt(m);
  const travel = frame > 0 ? s - arcAt(penMonth(frame - 1)) : 0;
  const tipL = Math.min(TIP_MAX, travel * TIP_PER_TRAVEL);
  const hasTip = tipL > 1.5;
  const sBody = hasTip ? s - tipL : s;
  const drawn = `${sBody.toFixed(2)} ${(TOTAL + 50).toFixed(0)}`;
  const tipBase = pointAtArc(sBody);
  const tipEnd = pointAtArc(s);

  // labels (world px; the slides are in screen px)
  const titleTag = { x: CX, y: CY - SPOKE_OUT - 148, size: 52 }; // caps ~0.67 em -> ~35 px, the year tags' digit height
  const startTag = { x: CX, y: CY - SPOKE_OUT - 34, size: 82 }; // old-style figures: x-height ~0.41 em -> 34 px
  const endTag = { x: CX, y: CY + 26, size: 70 };
  const titleIn = slideIn(frame, T.title);
  const endIn = slideIn(frame, T.endTag);

  // the hold: a faint highlight runs along the last loop into the line's end
  const shT = clamp01((frame - T.shine[0]) / (T.shine[1] - T.shine[0]));
  const shOp = Math.sin(Math.PI * shT);
  const shS = arcAt(T.shineFrom) + (arcAt(M_END) - arcAt(T.shineFrom)) * smoothstep(shT);

  const TILE = 640;
  const tiles: { x: number; y: number }[] = [];
  for (let y = -320; y < 2240; y += TILE) for (let x = -320; x < 1400; x += TILE) tiles.push({ x, y });

  const textProps = (size: number) => ({
    textAnchor: "middle" as const,
    fill: ink,
    stroke: DARK,
    strokeOpacity: 0.55,
    strokeWidth: size * 0.09,
    strokeLinejoin: "round" as const,
    paintOrder: "stroke" as const,
  });
  const tagStyle = (size: number, spacing = 0.1): React.CSSProperties => ({ fontFamily: fellSC, fontSize: size, letterSpacing: size * spacing });

  // the trade disc: the 1929 shape at scale sc about the centre (hatch and edge scale with it, edge width held)
  const sc = DISC_SCALE[Math.max(0, Math.min(DURATION, frame))];
  const discT = `translate(${CX} ${CY}) scale(${sc}) translate(${-CX} ${-CY})`;
  const discD = discOutline(sc, smoother((frame - MORPH[0]) / (MORPH[1] - MORPH[0])));
  const stretch = currentStretch(m, monthAtArc(sBody));

  return (
    <AbsoluteFill style={{ backgroundColor: LAND }}>
      {/* ---------------- THE PAGE, world space ---------------- */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: camCss }}>
        <Img src={staticFile(backdropSrc)} style={{ position: "absolute", left: -W * 0.05, top: -H * 0.05, width: W * 1.1, height: H * 1.1 }} />
        <div style={{ position: "absolute", left: 0, top: 0, opacity: 0.45 }}>
          {tiles.map((t, i) => (
            <Img key={`m-${i}`} src={staticFile(mottleSrc)} style={{ position: "absolute", left: t.x, top: t.y, width: TILE + 1, height: TILE + 1 }} />
          ))}
        </div>
      </div>

      {/* ---------------- THE CHART ---------------- */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <pattern id="tsHatch" patternUnits="userSpaceOnUse" width={96} height={12} patternTransform="rotate(-38)">
            <line x1={-1} y1={6} x2={97} y2={6} stroke={ink} strokeWidth={2.4} strokeOpacity={0.42} />
          </pattern>
          {hasTip ? (
            <linearGradient id="tsTip" gradientUnits="userSpaceOnUse" x1={tipBase[0]} y1={tipBase[1]} x2={tipEnd[0]} y2={tipEnd[1]}>
              <stop offset="0" stopColor={ink} />
              <stop offset="1" stopColor={SHINE} />
            </linearGradient>
          ) : null}
        </defs>
        <g transform={camSvg}>
          {/* reference: three rings, twelve spokes */}
          <path d={SPOKES_D} fill="none" stroke={ink} strokeOpacity={0.13} strokeWidth={1.8} strokeLinecap="round" />
          {RINGS.map((v) => (
            <circle key={`ring-${v}`} cx={CX} cy={CY} r={v * SCALE} fill="none" stroke={ink} strokeOpacity={0.2} strokeWidth={2} />
          ))}

          {/* the trade disc: one body, the 1929 shape, shrinking evenly with the rolling mean */}
          <g transform={discT}>
            <path d={discD} fill={ink} fillOpacity={0.07} />
            <path d={discD} fill="url(#tsHatch)" />
            <path d={discD} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={DISC_EDGE_W / sc + 2.6 / sc} strokeLinejoin="round" />
            <path d={discD} fill="none" stroke={ink} strokeOpacity={0.9} strokeWidth={DISC_EDGE_W / sc} strokeLinejoin="round" />
          </g>

          {/* the trade line: drawn up to the tip */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={SPIRAL_D} stroke={DARK} strokeOpacity={0.75} strokeWidth={CASE_W} strokeDasharray={drawn} />
            {/* the record: every drawn loop at a moderate tone, the 1929 ring a touch brighter */}
            <path d={SPIRAL_D} stroke={RECORD_TONE} strokeWidth={LINE_W} strokeDasharray={drawn} />
            <path d={REF_D} stroke={REF_TONE} strokeWidth={LINE_W} />
            {/* the pen's current stretch, bright, settling into the record behind it */}
            {stretch.map((p, i) => (
              <path key={`cur-${i}`} d={p.d} stroke={p.c} strokeWidth={LINE_W} strokeLinecap="butt" />
            ))}
          </g>
          {hasTip ? (
            <g>
              <path d={taperPath(sBody, s, CASE_W)} fill={DARK} fillOpacity={0.75} />
              <path d={taperPath(sBody, s, LINE_W)} fill="url(#tsTip)" />
            </g>
          ) : null}

          {/* the hold's highlight */}
          {shOp > 0.01
            ? [
                [150, 0.35],
                [70, 0.6],
                [26, 0.95],
              ].map(([len, o]) => {
                const a = Math.max(0, shS - len);
                const b = Math.min(s, shS);
                if (b - a < 0.5) return null;
                return (
                  <path
                    key={`sh-${len}`}
                    d={SPIRAL_D}
                    fill="none"
                    stroke={SHINE}
                    strokeOpacity={o * shOp}
                    strokeWidth={LINE_W + 1}
                    strokeLinecap="round"
                    strokeDasharray={`${(b - a).toFixed(2)} ${(TOTAL * 2).toFixed(0)}`}
                    strokeDashoffset={(-a).toFixed(2)}
                  />
                );
              })
            : null}

          {/* labels */}
          {titleIn.op > 0 ? (
            <text x={titleTag.x} y={titleTag.y + titleIn.dy / k} opacity={titleIn.op} {...textProps(titleTag.size)} style={tagStyle(titleTag.size, 0.24)}>
              {labels.title}
            </text>
          ) : null}
          <text x={startTag.x} y={startTag.y} {...textProps(startTag.size)} style={tagStyle(startTag.size)}>
            {labels.start}
          </text>
          {endIn.op > 0 ? (
            <text x={endTag.x} y={endTag.y + endIn.dy / k} opacity={endIn.op} {...textProps(endTag.size)} style={tagStyle(endTag.size)}>
              {labels.end}
            </text>
          ) : null}
        </g>
      </svg>

      {/* ---------------- PAPER: grain and vignette, screen space ---------------- */}
      <Img src={staticFile(grainSrc)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(3)}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default TradeSpiral;
