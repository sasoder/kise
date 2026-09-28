import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import { camEase, clamp, clamp01, smoothstep, sway } from "./fieldShared";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// PriorYearRecession: the sibling of InterestRatesGoDownV2 (same clip, same
// backdrop, title, readout, line, baseline, entrance and camera treatment).
//
// Sarah Paine, Russo-Japanese War clip "War runs on credit, and Russia's ran out":
//   "The Russians had already had a recession the prior year,"
//   (the war began 8 Feb 1904, so "the prior year" = 1903)
//
// IN-POINT 26.94 s = f0. 24 fps, f = round((t - 26.94) * 24):
//   the f0 · Russians f2 · had f10 · already f15 · had a f23 ·
//   recession f38 · the f48 · prior f54 · year f60 · line ends f73 (30.00 s)
// DURATION = round(3.06 * 24) = 73 + 16 (tail) = 89 frames = 3.71 s.
//
// THE DATA (never invented). Russian Empire pig-iron output, thousand metric
// tons, from M. Suhara, "Russian Industrial Statistics: An Estimation of a
// Production Index, 1860-1913", RRC Working Paper / Nihon Univ. (output
// appendix, from the official Russian series):
//   1899 2682 · 1900 2916 (peak) · 1901 2837 · 1902 2569 · 1903 2464 (trough)
//   · 1904 2954 (recovery, not drawn: the line stops at the war).
//   1900 -> 1903 = -15.5%, the heavy-industry core of the 1900-03 depression.
//   NOTE: the aggregate industrial indices do NOT fall into 1903 (Goldsmith
//   imputed 1900 100, 1901 103.2, 1902 103.7, 1903 105.7; Nutter 100, 100.0,
//   99.7, 103.9; Suhara's own ferrous-metals branch 100, 96.1, 89.0, 89.9):
//   total output stagnated 1900-02 while iron, the Witte-era engine, fell
//   three years running to its 1903 trough. This cut draws the iron series.
// Drawing: annual values at mid-year, joined by a monotone cubic (no
// overshoot); the 1903 value is held flat from mid-1903 to the war line.
// No values appear on screen.
//
// STYLE: InterestRatesGoDownV2's ink on the umber land backdrop. Cream only
// (orange = Japan's advantage in this clip, not used here): full cream for
// line / readout / active labels, ~0.5 for dashed and secondary, the gap
// hatch at low opacity.
//
// THE GESTURES, each with its word:
//   0. The line is already drawing at f0 (tip on 1900, rising into the
//      peak), one steady rightward tip for the whole cut; its first 60 px
//      fade in 0 -> full so it arrives from off-chart.        — f-14..72
//   1. "Russians" f0-12: title RUSSIAN IRON OUTPUT (the series is pig iron, not the whole economy) slides up + fades in; the
//      baseline (1903 | 1904 at 0.5), the dashed WAR marker and WAR label
//      come up with it.                                           — f0-14
//   2. "recession" f38: the tip tips over the 1900 peak and plunges through
//      1901-02 (steepest ~f25-38, the 1902 point lands f38); the old level
//      holds as a dashed 0.5 ghost behind the tip (f8-20 in); one front fills
//      the gap with the cream hatch (f20-74, trailing the tip); the readout RECESSION slides up,
//      full f36, settled f38.                                     — f8-38
//   3. "prior year" f54-60: the tip reaches the 1903 trough (f55); a thin
//      bracket draws under 1903 from its centre and the 1903 label brightens
//      0.5 -> 1, both landing f60; the tip slows onto the WAR line (f72),
//      still low.                                                  — f50-72
//   4. Camera: one long eased glide right following the tip (pre-rolled from
//      f-36, already moving at f0, ~180 px of travel left in it at f0; the
//      title and readout are screen-fixed, the chart and backdrop glide),
//      landing f50 with the column (x 96-969, as V2) centred; a
//      3% creep from f44 pivoting on the baseline; a pale highlight travels
//      the line peak -> war through the tail f72-88; house sway.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 89;
export const W = 1080;
export const H = 1920;

export const INK = "#E9DDBF";
const SHADE = "#140F0A";

export const schema = z.object({
  ink: z.string(),
  backdropSrc: z.string(),
  vignette: z.number(),
  labels: z.object({
    title: z.string(),
    readout: z.string(),
    war: z.string(),
    y1903: z.string(),
    y1904: z.string(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  vignette: 0.32,
  labels: { title: "RUSSIAN IRON OUTPUT", readout: "RECESSION", war: "WAR", y1903: "1903", y1904: "1904" },
});

// ---------------------------------------------------------------------------
// The series and the world (world units == screen px at k 1, camera settled).
// ---------------------------------------------------------------------------
const DATA: [number, number][] = [
  [1899.5, 2682],
  [1900.5, 2916],
  [1901.5, 2837],
  [1902.5, 2569],
  [1903.5, 2464],
  [1904.0, 2464], // the 1903 level held to the war line
];
const Y_START = 1899.5;
const Y_PEAKYR = 1900.5;
const Y_WAR = 1904.0;

const YEAR_W = 150;
const X_WAR = 120 + 4.5 * YEAR_W; // the 1899 start at x120, the column 96-969 like V2
const xOfYear = (y: number) => X_WAR + (y - Y_WAR) * YEAR_W;
const V_PEAK = 2916;
const Y_PEAK = 895; // peak height in px
const PX_PER_KT = 155 / (2916 - 2464); // peak -> trough = 155 px
const yOfVal = (v: number) => Y_PEAK + (V_PEAK - v) * PX_PER_KT;

// monotone cubic (Fritsch-Carlson), no overshoot at the peak or the trough
const monotone = (() => {
  const n = DATA.length;
  const xs = DATA.map((d) => d[0]);
  const ys = DATA.map((d) => d[1]);
  const dk: number[] = [];
  for (let i = 0; i < n - 1; i++) dk.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(n).fill(0);
  m[0] = dk[0];
  m[n - 1] = dk[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = dk[i - 1] * dk[i] <= 0 ? 0 : (dk[i - 1] + dk[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (dk[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / dk[i];
    const b = m[i + 1] / dk[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * dk[i];
      m[i + 1] = t * b * dk[i];
    }
  }
  return (x: number) => {
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = Math.max(0, Math.min(1, (x - xs[i]) / h));
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
    );
  };
})();

// the curve, sampled once
const SAMPLES_PER_YEAR = 90;
type Pt = { x: number; y: number; yr: number };
const CURVE: Pt[] = (() => {
  const out: Pt[] = [];
  const n = Math.round((Y_WAR - Y_START) * SAMPLES_PER_YEAR);
  for (let i = 0; i <= n; i++) {
    const yr = Y_START + (i / n) * (Y_WAR - Y_START);
    out.push({ x: xOfYear(yr), y: yOfVal(monotone(yr)), yr });
  }
  return out;
})();
const ptsToD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("");
const curveUpTo = (yr: number) => {
  const pts = CURVE.filter((p) => p.yr <= yr);
  if (yr > Y_START && yr < Y_WAR) pts.push({ x: xOfYear(yr), y: yOfVal(monotone(yr)), yr });
  return pts;
};

// the peak -> war stretch, with arc length, for the tail highlight
const TAIL = CURVE.filter((p) => p.yr >= Y_PEAKYR);
const TAIL_S: number[] = TAIL.reduce<number[]>((acc, p, i) => {
  acc.push(i ? acc[i - 1] + Math.hypot(p.x - TAIL[i - 1].x, p.y - TAIL[i - 1].y) : 0);
  return acc;
}, []);
const TAIL_LEN = TAIL_S[TAIL_S.length - 1];
const tailBetween = (s0: number, s1: number) => TAIL.filter((_, i) => TAIL_S[i] >= s0 && TAIL_S[i] <= s1);

const X_PEAK = xOfYear(Y_PEAKYR);
const X_START = xOfYear(Y_START);
const LINE_FADE = 60;
const X_1903 = xOfYear(1903);
const Y_TROUGH = yOfVal(2464);

const BASE = 1089;
const BASE_L = xOfYear(Y_START) - 24;
const BASE_R = xOfYear(1904.0 + 1) + 24;
const YEAR_Y = 1140;
const TICKS = [1900, 1901, 1902, 1903, 1904].map(xOfYear);
const WAR_TOP = 872;
const WAR_LABEL_Y = 852;
const BRACKET_Y = 1104;

const TITLE_Y = 585;
const READOUT_Y = 767; // baseline; caps sit ~680-767

// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
export const T = {
  intro: [0, 12] as const,
  ghost: [8, 20] as const,
  readout: 29, // slides up f29-38, full f36
  band: [20, 74] as const,
  bandWarp: 0.8,
  bracket: [50, 60] as const,
  shimmer: [72, 88] as const,
};
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

// the tip: constant speed (1902 point on f38), then a quadratic slow onto the
// war line at f72.
const TIP_V = 1.5 / 26; // years per frame
const TIP_DECEL = 16;
const TIP_STOP = 72;
export const tipYear = (f: number) => {
  const fs = TIP_STOP - TIP_DECEL;
  if (f <= fs) return 1902.5 + (f - 38) * TIP_V;
  const y0 = 1902.5 + (fs - 38) * TIP_V;
  const t = Math.min(f - fs, TIP_DECEL);
  return y0 + TIP_V * (t - (t * t) / (2 * TIP_DECEL));
};

const BAND_OVER = 22;
export const bandX = (f: number) => {
  const u = clamp01((f - T.band[0]) / (T.band[1] - T.band[0]));
  return X_PEAK + camEase(u, T.bandWarp) * (X_WAR + BAND_OVER - X_PEAK);
};

// the camera: a glide in x (pre-rolled so it is moving on f0), then a creep.
const GLIDE = [-36, 50] as const;
const CX0 = 250;
const CX1 = 540;
export const camX = (f: number) => {
  const u = clamp01((f - GLIDE[0]) / (GLIDE[1] - GLIDE[0]));
  return CX0 + smoothstep(u) * (CX1 - CX0);
};
const PIVOT = { x: 560, y: BASE };
const CREEP_K = 1.03;
export const camK = (f: number) => Math.pow(CREEP_K, smoothstep((f - 44) / 56));

// ---------------------------------------------------------------------------
const PriorYearRecession: React.FC<Props> = ({ ink, backdropSrc, vignette, labels }) => {
  const frame = useCurrentFrame();

  const k = camK(frame);
  const drift = sway(frame);
  const tx = PIVOT.x - PIVOT.x * k + drift.dx * 0.6;
  const ty = PIVOT.y - PIVOT.y * k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const glide = CX1 - camX(frame); // world shift, 0 when settled
  const glideT = `translate(${glide.toFixed(3)} 0)`;
  const bgShift = 0.15 * (glide - (CX1 - CX0) / 2);

  // intro (title + axis)
  const introOp = interpolate(frame, [T.intro[0], T.intro[0] + 8], [0, 1], clamp);
  const introDy = interpolate(frame, [T.intro[0], T.intro[1]], [24, 0], { easing: EASE_LAND, ...clamp });
  const axisOp = interpolate(frame, [1, 10], [0, 1], clamp);
  const labelOp = interpolate(frame, [2, 9], [0, 1], clamp);
  const labelDy = interpolate(frame, [2, 14], [24, 0], { easing: EASE_LAND, ...clamp });
  const warGrow = interpolate(frame, [2, 14], [0, 1], { easing: EASE_LAND, ...clamp });

  // the line
  const tipYr = tipYear(frame);
  const tipX = xOfYear(Math.min(tipYr, Y_WAR));
  const drawn = tipYr > Y_START ? curveUpTo(tipYr) : [];
  const lineD = drawn.length > 1 ? ptsToD(drawn) : "";

  // the old level, dashed, behind the tip
  const ghostOp = 0.5 * smoothstep((frame - T.ghost[0]) / (T.ghost[1] - T.ghost[0]));
  const ghostX1 = Math.min(tipX, X_WAR);

  // the gap, filled by one front
  const fx = bandX(frame);
  const bandOn = frame >= T.band[0] && fx - X_PEAK > 0.5 && tipX > X_PEAK;
  const gapPts = curveUpTo(Math.min(tipYr, Y_WAR)).filter((p) => p.yr >= Y_PEAKYR);
  const gapD =
    gapPts.length > 1
      ? `${ptsToD(gapPts)}L${gapPts[gapPts.length - 1].x.toFixed(2)},${Y_PEAK}L${X_PEAK},${Y_PEAK}Z`
      : "";

  // readout
  const R0 = T.readout;
  const inDy = interpolate(frame, [R0, R0 + 9], [24, 0], { easing: EASE_LAND, ...clamp });
  const inOp = interpolate(frame, [R0 + 1, R0 + 7], [0, 1], clamp);

  // "prior year": bracket + 1903 brightening
  const brU = interpolate(frame, [T.bracket[0], T.bracket[1]], [0, 1], { easing: EASE_LAND, ...clamp });
  const brL = X_1903 + 8;
  const brR = X_WAR - 8;
  const brC = (brL + brR) / 2;
  const brHalf = ((brR - brL) / 2) * brU;
  const y1903Op = 0.5 + 0.5 * brU;

  // tail highlight along the line, peak -> war
  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shS = TAIL_LEN * smoothstep(shT);
  const shOp = Math.sin(Math.PI * shT) * 0.55;

  const halo = { stroke: SHADE, strokeOpacity: 0.5, paintOrder: "stroke" as const };
  const DASH = "12 8";

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* backdrop, world space, oversized 10%, light parallax on the glide */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${tx + bgShift}px, ${ty}px) scale(${k})`,
        }}
      >
        <Img
          src={staticFile(backdropSrc)}
          style={{ position: "absolute", left: -W * 0.05, top: -H * 0.05, width: W * 1.1, height: H * 1.1 }}
        />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <pattern id="pyrHatch" patternUnits="userSpaceOnUse" width={16} height={16} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={16} stroke={ink} strokeWidth={3} />
          </pattern>
          <linearGradient id="pyrFrontGrad" gradientUnits="userSpaceOnUse" x1={fx - 18} y1={0} x2={fx} y2={0}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="pyrFront" maskUnits="userSpaceOnUse" x={X_PEAK - 40} y={Y_PEAK - 40} width={X_WAR - X_PEAK + 80} height={Y_TROUGH - Y_PEAK + 80}>
            <rect x={X_PEAK - 40} y={Y_PEAK - 40} width={X_WAR - X_PEAK + 80} height={Y_TROUGH - Y_PEAK + 80} fill="url(#pyrFrontGrad)" />
          </mask>
          {gapD ? (
            <clipPath id="pyrGap">
              <path d={gapD} />
            </clipPath>
          ) : null}
          {/* the line arrives from off-chart: its first 60 px fade 0 -> full */}
          <linearGradient id="pyrLineInGrad" gradientUnits="userSpaceOnUse" x1={X_START} y1={0} x2={X_START + LINE_FADE} y2={0}>
            <stop offset="0" stopColor="#000" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <mask id="pyrLineIn" maskUnits="userSpaceOnUse" x={X_START - 20} y={0} width={X_WAR - X_START + 60} height={H}>
            <rect x={X_START - 20} y={0} width={X_WAR - X_START + 60} height={H} fill="url(#pyrLineInGrad)" />
          </mask>
        </defs>

        <g transform={camT}>
          {/* title */}
          <text
            x={W / 2}
            y={TITLE_Y + introDy}
            textAnchor="middle"
            fill={ink}
            opacity={0.9 * introOp}
            {...halo}
            strokeWidth={4}
            style={{ fontFamily: fellSC, fontSize: 40, letterSpacing: 40 * 0.3 }}
          >
            {labels.title}
          </text>

          {/* the readout */}
          {inOp > 0 ? (
            <text
              x={W / 2}
              y={READOUT_Y + inDy}
              opacity={inOp}
              textAnchor="middle"
              fill={ink}
              {...halo}
              strokeWidth={7}
              style={{ fontFamily: fell, fontSize: 128, letterSpacing: 128 * 0.03 }}
            >
              {labels.readout}
            </text>
          ) : null}

          <g transform={glideT}>
            {/* baseline with a tick at every January, labels only 1903 | 1904 */}
            <g opacity={axisOp}>
              <line x1={BASE_L} y1={BASE} x2={BASE_R} y2={BASE} stroke={SHADE} strokeOpacity={0.45} strokeWidth={5} />
              <line x1={BASE_L} y1={BASE} x2={BASE_R} y2={BASE} stroke={ink} strokeOpacity={0.8} strokeWidth={2.2} />
              {TICKS.map((x) => (
                <line key={`t-${x}`} x1={x} y1={BASE} x2={x} y2={BASE + 14} stroke={ink} strokeOpacity={0.8} strokeWidth={2.4} />
              ))}
            </g>
            {[
              [(X_1903 + X_WAR) / 2, labels.y1903, y1903Op],
              [X_WAR + YEAR_W / 2, labels.y1904, 0.5],
            ].map(([x, t, o]) => (
              <text
                key={`y-${t}`}
                x={x as number}
                y={YEAR_Y + labelDy}
                textAnchor="middle"
                fill={ink}
                opacity={(o as number) * labelOp}
                {...halo}
                strokeWidth={4}
                style={{ fontFamily: fell, fontSize: 34, letterSpacing: 34 * 0.06 }}
              >
                {t}
              </text>
            ))}

            {/* "prior year": the bracket under 1903, drawn from its centre */}
            {brU > 0.001
              ? [
                  [SHADE, 0.45, 5.5],
                  [ink, 1, 2.4],
                ].map(([c, o, w]) => (
                  <path
                    key={`br-${c}`}
                    d={`M${brC - brHalf},${BRACKET_Y - 8 * brU}V${BRACKET_Y}H${brC + brHalf}V${BRACKET_Y - 8 * brU}`}
                    fill="none"
                    stroke={c as string}
                    strokeOpacity={o as number}
                    strokeWidth={w as number}
                    strokeLinejoin="round"
                  />
                ))
              : null}

            {/* the WAR line at 1 Jan 1904 */}
            <line
              x1={X_WAR}
              y1={BASE}
              x2={X_WAR}
              y2={BASE - (BASE - WAR_TOP) * warGrow}
              stroke={ink}
              strokeOpacity={0.5 * axisOp}
              strokeWidth={2.6}
              strokeDasharray="10 8"
            />
            <text
              x={X_WAR}
              y={WAR_LABEL_Y + labelDy}
              textAnchor="middle"
              fill={ink}
              opacity={0.5 * labelOp}
              {...halo}
              strokeWidth={4}
              style={{ fontFamily: fellSC, fontSize: 30, letterSpacing: 30 * 0.3 }}
            >
              {labels.war}
            </text>

            {/* the gap: cream hatch, one front peak -> war */}
            {bandOn && gapD ? (
              <g mask="url(#pyrFront)">
                <g clipPath="url(#pyrGap)">
                  <rect x={X_PEAK} y={Y_PEAK} width={X_WAR - X_PEAK} height={Y_TROUGH - Y_PEAK + 2} fill={ink} fillOpacity={0.08} />
                  <rect x={X_PEAK} y={Y_PEAK} width={X_WAR - X_PEAK} height={Y_TROUGH - Y_PEAK + 2} fill="url(#pyrHatch)" opacity={0.32} />
                </g>
              </g>
            ) : null}

            {/* the old level, dashed, holding the height behind the tip */}
            {ghostOp > 0 && ghostX1 > X_PEAK ? (
              <line x1={X_PEAK} y1={Y_PEAK} x2={ghostX1} y2={Y_PEAK} stroke={ink} strokeOpacity={ghostOp} strokeWidth={3} strokeDasharray={DASH} />
            ) : null}

            {/* the output: one cream line, drawing rightward */}
            {lineD ? (
              <g mask="url(#pyrLineIn)">
                <path d={lineD} fill="none" stroke={SHADE} strokeOpacity={0.5} strokeWidth={8.5} strokeLinejoin="round" strokeLinecap="round" />
                <path d={lineD} fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ) : null}

            {/* tail highlight travelling the line */}
            {shOp > 0.01
              ? [
                  [90, 0.3],
                  [44, 0.5],
                  [16, 0.75],
                ].map(([len, o]) => {
                  const seg = tailBetween(shS - len / 2, shS + len / 2);
                  return seg.length > 1 ? (
                    <path
                      key={`sh-${len}`}
                      d={ptsToD(seg)}
                      fill="none"
                      stroke="#FFF4DA"
                      strokeOpacity={o * shOp}
                      strokeWidth={5.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null;
                })
              : null}
          </g>
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(
            3,
          )}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default PriorYearRecession;
