// ---------------------------------------------------------------------------
// TooMuchCarbon (neal-stephenson-trailer, cut 22). Core memory podcast style (styles/core-memory.md), the clip's
// archive-collage look (nealShared.tsx). Opaque 1920x1080, 23.976 fps, 110 frames. Director's suggestion, over the
// ENABLED V1 (the user may keep or drop it; cut 18 still works alone).
//
// CHECK LINE: "Neal's first fear is real and measured: CO2 at Mauna Loa climbing every year since 1958, sawtooth and
// all."
//
// THE LINE (Neal): "The two big problems that I'm scared of are too much carbon in the atmosphere, and…"
// WORD -> FRAME: two 3 · big 7 · problems 14 · that 28 · I'm 39 · scared 43 · of 49 · are 58 · too 65 · much 71 ·
//   carbon 76 · in 85 · the 89 · atmosphere 92 (ends ~103) · and 104 · cut 110.
// DURATION: the slot 22.4808 -> 27.0687 s = 4.588 s x 23.976 = 110 frames (sequence f539 -> f649; f0..f109).
//
// THE MOTION: f0 is cut 18's last frame (the S-curve graph on the paper). The camera pans right along the same paper
// (one acceleration, one deceleration, a slight breath out and a lift; landing ~f38), leaving the S-curve behind, onto
// a second graph in the same white-ink axis style whose axes draw out of their corner as it comes into view (f10-f40,
// the x-axis tip running ahead of the camera), with "1958" and "2026" rising in under the x-axis ends. From f42
// ("scared") the CO2 line draws every month from March 1958, left to right at an even pace, the seasonal sawtooth
// showing, its tip reaching September 2026 on "atmosphere" (f95): one line growing through "scared of are too much
// carbon in the atmosphere". "CO2" rises in beside the end (f86). f96-109: the complete record held alive (a slow
// creep in, paper drift, film life). No chain (the CO2 record is not Neal's own).
//
// WEIGHT: the axes AND the CO2 record are at STROKE (6 world px) on the +4/+4 SHADOW_OFF, not the clip's GRAPH_STROKE
// 12 / +6 used for 18's smooth curves. The exception is deliberate (director's review): a dense real-data line's
// seasonal teeth (~22 px apart, ~17 px tall here) fill in at 12 px and read as a twisted rope; at 6 px they read as the
// familiar Keeling sawtooth.
//
// JOIN: imports SCURVE_JOIN_FRAME / SCURVE_END_CAM / SCURVE_END_STATE / GRAPH / SCurveGraph from SCurveGuy (read-only).
// The camera continues 18's own damped track: 18's camera keys are restated below, asserted at module load to give
// exactly SCURVE_END_CAM at 18's last frame, and this cut's keys extend that track, so the camera's position AND
// velocity carry across the join. Paper and film life run on frame + SCURVE_JOIN_FRAME; x0/y0 stay 560/541.
//
// SOURCES: NOAA Global Monitoring Laboratory, Mauna Loa monthly mean CO2, co2_mm_mlo.csv (column `average`, ppm), file
// created 9 Oct 2026: March 1958 315.71 -> September 2026 426.07, highest monthly 432.34 (May 2026); 823 months, all
// drawn (co2MaunaLoa.ts, baked by scripts/clips/neal-stephenson-trailer/bake-co2-mauna-loa.py). On screen: the years
// 1958 and 2026 and the label CO2; no ppm figures.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CO2_FIRST,
  CO2_LAST,
  CO2_MAX,
  CO2_MIN,
  CO2_PPM,
  CO2_T,
} from "./co2MaunaLoa";
import {
  CaptionBands,
  INK,
  Inked,
  type NealCam,
  NealFilmLife,
  NealPaper,
  NealPlane,
  NealSvg,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  clamp,
  fontFamily,
  inCaptionBand,
  runCamera2,
  textRise,
  type,
} from "./nealShared";
import {
  GRAPH,
  SCURVE_END_CAM,
  SCURVE_END_STATE,
  SCURVE_JOIN_FRAME,
  SCurveGraph,
} from "./SCurveGuy";

export const FPS = 24000 / 1001;
export const DURATION = 110;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the CO2 graph (world px, the d = 1 plane; the same paper as 18's graph, further right) ----------------------------
// Same baseline and axis top as 18's graph, so the two sit on one line of the page.
const BASE = GRAPH.baseY; // 568
const AXIS_TOP = GRAPH.axisTopY; // 110
const GX0 = 2000; // the y-axis (280 px of paper after 18's baseline ends at x 1720)
const GX1 = 3500; // the x-axis end = September 2026
const DX0 = GX0 + 10; // March 1958: the curve's round cap clears the y-axis
// y: the lowest month (312.42, Oct 1958) sits 28 px above the baseline, the highest (432.34, May 2026) at y 200
const Y_LO = BASE - 28;
const Y_HI = 200;
const SY = (Y_LO - Y_HI) / (CO2_MAX - CO2_MIN); // world px per ppm
const xOfT = (t: number) =>
  DX0 + ((t - CO2_FIRST.t) / (CO2_LAST.t - CO2_FIRST.t)) * (GX1 - DX0);
const yOfPpm = (p: number) => Y_LO - (p - CO2_MIN) * SY;
const PX = CO2_T.map(xOfT);
const PY = CO2_PPM.map(yOfPpm);
const N = PX.length;

/** The record drawn up to month index `u` (0 .. N-1, fractional = partway to the next month). */
const co2Path = (u: number) => {
  if (u <= 0) return "";
  const i = Math.min(N - 1, Math.floor(u));
  const parts: string[] = [`M${PX[0].toFixed(2)} ${PY[0].toFixed(2)}`];
  for (let j = 1; j <= i; j++)
    parts.push(`L${PX[j].toFixed(2)} ${PY[j].toFixed(2)}`);
  const fr = u - i;
  if (i < N - 1 && fr > 0) {
    parts.push(
      `L${(PX[i] + fr * (PX[i + 1] - PX[i])).toFixed(2)} ${(PY[i] + fr * (PY[i + 1] - PY[i])).toFixed(2)}`,
    );
  }
  if (parts.length === 1)
    parts.push(`L${(PX[0] + 0.01).toFixed(2)} ${PY[0].toFixed(2)}`);
  return parts.join(" ");
};

// -- timing -------------------------------------------------------------------------------------------------------------
/** Axes: drawn out of their corner by two tips, the y-axis up and the x-axis right, f10 -> f40. The corner enters the
 *  frame ~f8, so the drawing starts as soon as it is in view and the x-axis tip runs ahead of the camera across the
 *  right half of the frame (screen x ~1500-1700 through the pan), leading the eye to where the record will be; no frame
 *  of the pan is empty paper. Eased in and out (half drawn at f25, landing with the camera). */
const AX_F0 = 10;
const AX_F1 = 40;
const axisProg = (f: number) =>
  interpolate(f, [AX_F0, AX_F1], [0, 1], {
    easing: Easing.inOut(Easing.sin),
    ...clamp,
  });
/** The record: March 1958 at f42 (just before "scared", as the camera settles), September 2026 on "atmosphere" (f95).
 *  Time marches, so the tip runs at a constant pace in years, with a short 6-frame ramp at each end (a trapezoid
 *  velocity profile). */
const REC_F0 = 42;
const REC_F1 = 95;
const RAMP = 6;
const recProg = (f: number) => {
  const T = REC_F1 - REC_F0;
  const t = Math.max(0, Math.min(T, f - REC_F0));
  const v = 1 / (T - RAMP); // cruise speed (fraction per frame), so the total is 1
  if (t < RAMP) return (0.5 * v * t * t) / RAMP;
  if (t > T - RAMP) {
    const r = T - t;
    return 1 - (0.5 * v * r * r) / RAMP;
  }
  return 0.5 * v * RAMP + v * (t - RAMP);
};
/** Type: textRise (24 screen px up while fading in, 12 frames). */
const T_1958 = 36;
const T_2026 = 40;
const T_CO2 = 86;

// -- the camera: 18's own damped track, extended ------------------------------------------------------------------------
// Global frame G = this cut's frame + SCURVE_JOIN_FRAME. Keys G 0..98 restate SCurveGuy's camera keys verbatim (asserted
// below against SCURVE_END_CAM); keys after G 98 are this cut's. The pan: x target runs 1000 -> 2750 (the CO2 graph's
// middle) on one eased ramp, f0 -> f30; the damped follow lags it ~6 frames, so the camera lands ~f38 (under 2 px/f
// by ~f40) with no overshoot. On the way the camera breathes out a little (k 1.03 -> ~0.89 at ~f20 -> 1.0), so
// mid-pan the S-curve's plateau and the new axes share the frame and the screen speed peaks lower (~62 px/f). The fast
// stretch (~f6-f34) takes the house fast-pan recipe, lightened: a horizontal-only Gaussian on the ink plane, sigma 0.08
// x the camera's screen px per frame (peak ~5 px), exactly 0 when slow (deathCountShared's blurX uses ~0.22; at 0.15-0.22 the new
// y-axis, a thin vertical drawing during the pan, smeared to a grey ghost); paper and film life stay sharp. A slight lift (y 540 -> 580) puts the new baseline
// just above the frame's middle (screen y ~528), so the years under it clear the first caption band. Then a slow creep
// in (k 1.0 -> 1.025, y 580 -> 572, x +22) to the last frame.
const J = SCURVE_JOIN_FRAME;
const keyed = (keys: [number, number][]) => (g: number) =>
  interpolate(
    g,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    clamp,
  );
// 18's keys (SCurveGuy.tsx, "the camera"), G 0 .. 98
const X18: [number, number][] = [
  [0, 560],
  [10, 580],
  [38, 955],
  [84, 990],
  [98, 1000],
];
const Y18: [number, number][] = [
  [0, 541],
  [36, 541],
  [52, 518],
  [62, 518],
  [82, 540],
  [98, 540],
];
const K18: [number, number][] = [
  [0, 1.8],
  [6, 1.78],
  [36, 1.0],
  [70, 1.0],
  [98, 1.035],
];
const PAN_F1 = 30;
const CAM_X_LAND = (GX0 + GX1) / 2; // 2750
const CAM_Y_LAND = BASE + 12; // the baseline 12 px above the frame's middle
const smooth = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  return x * x * (3 - 2 * x);
};
/** The pan's target profile: half linear, half smoothstep, so the cruise is long and its peak speed low (~54 screen
 *  px/f against ~64 for a plain smoothstep); the damped follow rounds the start and the landing. */
const panEase = (u: number) =>
  0.5 * Math.max(0, Math.min(1, u)) + 0.5 * smooth(u);
const camXOwn = (f: number) => {
  if (f <= PAN_F1) return 1000 + (CAM_X_LAND - 1000) * panEase(f / PAN_F1);
  return CAM_X_LAND + 22 * smooth((f - PAN_F1) / (DURATION - 1 - PAN_F1));
};
const camYOwn = (f: number) => {
  if (f <= PAN_F1) return 540 + (CAM_Y_LAND - 540) * smooth(f / PAN_F1);
  return CAM_Y_LAND - 8 * smooth((f - PAN_F1) / (DURATION - 1 - PAN_F1));
};
// k: 18 ends heading to 1.035; across the pan it breathes out to 0.88 (target, f16) and back to 1.0 (the wide graph
// lands at the same scale as 18's), then creeps in to 1.025 over the record and the hold.
const K_DIP = 0.88;
const K_DIP_F = 16;
const camKOwn = (f: number) => {
  if (f <= K_DIP_F) return 1.035 + (K_DIP - 1.035) * smooth(f / K_DIP_F);
  if (f <= PAN_F1)
    return K_DIP + (1.0 - K_DIP) * smooth((f - K_DIP_F) / (PAN_F1 - K_DIP_F));
  return 1.0 + 0.025 * smooth((f - PAN_F1) / (DURATION - 1 - PAN_F1));
};

const CAM_F: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
const x18 = keyed(X18);
const y18 = keyed(Y18);
const k18 = keyed(K18);
for (let g = 0; g <= J + DURATION; g++) {
  CAM_F.push(g);
  CAM_CX.push(g <= J ? x18(g) : camXOwn(g - J));
  CAM_CY.push(g <= J ? y18(g) : camYOwn(g - J));
  CAM_K.push(g <= J ? k18(g) : camKOwn(g - J));
}
// the camera state at every global frame, computed once (runCamera2 is O(upto))
const CAMS: NealCam[] = [];
{
  for (let f = 0; f < DURATION; f++) {
    const { cx, cy, k } = runCamera2(J + f, CAM_F, CAM_CY, CAM_CX, CAM_K);
    CAMS.push({ x: cx, y: cy, k, x0: CAM_CX[0], y0: CAM_CY[0] });
  }
}
const camAt = (f: number): NealCam =>
  CAMS[Math.max(0, Math.min(DURATION - 1, Math.round(f)))];
const PAN_BLUR = 0.08;
/** The fast-pan blur (screen px sigma, horizontal only): PAN_BLUR x the camera's horizontal screen speed, faded in between
 *  8 and 24 px/f so it is exactly 0 when slow (and at the join). */
const panBlur = (f: number) => {
  const i = Math.max(1, Math.min(DURATION - 1, Math.round(f)));
  const v = Math.abs(CAMS[i].x - CAMS[i - 1].x) * CAMS[i].k;
  const w = smooth((v - 8) / 16);
  return w > 0 ? PAN_BLUR * v * w : 0;
};

// -- module-load checks ---------------------------------------------------------------------------------------------------
{
  const c = CAMS[0];
  const e = SCURVE_END_CAM;
  const d = Math.max(
    Math.abs(c.x - e.x),
    Math.abs(c.y - e.y),
    Math.abs(c.k - e.k),
  );
  if (d > 1e-9 || c.x0 !== e.x0 || c.y0 !== e.y0) {
    throw new Error(
      `TooMuchCarbon: f0 camera ${JSON.stringify(c)} != SCURVE_END_CAM ${JSON.stringify(e)}`,
    );
  }
  if (CO2_FIRST.year !== 1958 || CO2_LAST.year !== 2026 || N !== CO2_PPM.length)
    throw new Error("TooMuchCarbon: CO2 data");
}

// -- type -----------------------------------------------------------------------------------------------------------------
const YEAR_SIZE = 56; // the style's label size
const CO2_SIZE = 56;
const CAP = 0.7; // Barlow cap height per em
const YEAR_BASE = BASE + STROKE / 2 + 10 + YEAR_SIZE * CAP; // years hang under the baseline
// CO2: right-aligned up-left of the record's end, in the empty upper left of the graph
const CO2_X = GX1 - 48;
const CO2_BASE = Y_HI - 30;

// the screen footprint of the type, the baseline and the record's end must stay above y 600 (bands 607-703, 765-821)
for (let f = 0; f < DURATION; f++) {
  const c = camAt(f);
  const sy = (y: number) => 540 + (y - c.y) * c.k;
  const yearBottom = sy(YEAR_BASE + SHADOW_OFF);
  if (
    f >= T_1958 &&
    (yearBottom >= 600 ||
      inCaptionBand(sy(YEAR_BASE - YEAR_SIZE * CAP), yearBottom))
  ) {
    throw new Error(
      `TooMuchCarbon: year labels reach screen y ${yearBottom.toFixed(1)} at f${f}`,
    );
  }
  if (sy(BASE + SHADOW_OFF + STROKE / 2) >= 600)
    throw new Error(`TooMuchCarbon: baseline in a band at f${f}`);
}

// -- drawing ----------------------------------------------------------------------------------------------------------------
const lineProps = (stroke: string, width: number = STROKE) => ({
  fill: "none",
  stroke,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const Axes: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0) return null;
  const yl = (BASE - AXIS_TOP) * p;
  const xl = (GX1 - GX0) * p;
  return (
    <Inked
      render={(c) => (
        <path
          d={`M${GX0} ${BASE - yl} L${GX0} ${BASE} L${GX0 + xl} ${BASE}`}
          {...lineProps(c, STROKE)}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      )}
    />
  );
};

const Rising: React.FC<{
  frame: number;
  f0: number;
  k: number;
  children: (dy: number) => React.ReactNode;
}> = ({ frame, f0, k, children }) => {
  const r = textRise(frame, f0, k);
  if (r.opacity <= 0) return null;
  return (
    <g opacity={r.opacity < 1 ? r.opacity : undefined}>{children(r.dy)}</g>
  );
};

const YearLabel: React.FC<{ text: string; x: number; dy: number }> = ({
  text,
  x,
  dy,
}) => (
  <Inked
    render={(fill) => (
      <text
        x={x}
        y={YEAR_BASE + dy}
        textAnchor="middle"
        fill={fill}
        style={type(YEAR_SIZE, 800)}
      >
        {text}
      </text>
    )}
  />
);

/** "CO2" with a true subscript 2 (a smaller 2 dropped below the baseline; Barlow's latin subset has no U+2082). */
const Co2Label: React.FC<{ dy: number }> = ({ dy }) => (
  <Inked
    render={(fill) => (
      <text
        x={CO2_X}
        y={CO2_BASE + dy}
        textAnchor="end"
        fill={fill}
        style={type(CO2_SIZE, 900)}
      >
        CO
        <tspan
          fontSize={CO2_SIZE * 0.62}
          dy={CO2_SIZE * 0.16}
          style={{ fontFamily }}
        >
          2
        </tspan>
      </text>
    )}
  />
);

const TooMuchCarbon: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const g = frame + J;
  const rec = co2Path(recProg(frame) * (N - 1));
  const blur = panBlur(frame);
  return (
    <AbsoluteFill>
      <NealFilmLife frame={g}>
        <NealPaper frame={g} cam={cam} />
        {blur > 0 ? (
          <svg
            width={0}
            height={0}
            style={{ position: "absolute" }}
            aria-hidden
          >
            <defs>
              <filter
                id="tmc-panblur"
                colorInterpolationFilters="sRGB"
                x="-12%"
                y="0%"
                width="124%"
                height="100%"
              >
                <feGaussianBlur stdDeviation={`${blur.toFixed(3)} 0`} />
              </filter>
            </defs>
          </svg>
        ) : null}
        <AbsoluteFill
          style={blur > 0 ? { filter: "url(#tmc-panblur)" } : undefined}
        >
          <NealPlane cam={cam}>
            <NealSvg>
              {/* cut 18's graph, exactly as it ends, left behind on the paper */}
              <SCurveGraph {...SCURVE_END_STATE} />
              <Axes p={axisProg(frame)} />
              {rec ? (
                <g>
                  <path
                    d={rec}
                    transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}
                    {...lineProps(SHADOW, STROKE)}
                  />
                  <path d={rec} {...lineProps(INK, STROKE)} />
                </g>
              ) : null}
              <Rising frame={frame} f0={T_1958} k={cam.k}>
                {(dy) => <YearLabel text="1958" x={DX0} dy={dy} />}
              </Rising>
              <Rising frame={frame} f0={T_2026} k={cam.k}>
                {(dy) => <YearLabel text="2026" x={GX1} dy={dy} />}
              </Rising>
              <Rising frame={frame} f0={T_CO2} k={cam.k}>
                {(dy) => <Co2Label dy={dy} />}
              </Rising>
            </NealSvg>
          </NealPlane>
        </AbsoluteFill>
      </NealFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default TooMuchCarbon;
