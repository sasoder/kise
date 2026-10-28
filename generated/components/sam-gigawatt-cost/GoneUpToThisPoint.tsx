// ---------------------------------------------------------------------------
// GoneUpToThisPoint (sam-gigawatt-cost, cut 3). Cheeky Pint style, the realistic variant carried into the air
// (styles/cheeky-pint.md; the Scott Kirby clips' world: AirStage from scott-aircraft-order/aircraftShared.tsx,
// imported read-only, no aircraft). Opaque 1080x1920, 23.976 fps, 34 frames. Joined to cut 1 (FrontierCostClimbs).
//
// CHECK LINE: "for over a decade frontier AI cost almost nothing to train, and then it shot up — that's where we are
// now."
//
// THE LINE (John Collison): "Why? Because it's gone up to this point, right?" — this slot holds "Because it's gone up
// to this point, right?"; then Sam on camera: "I mean, …".
// WORD -> FRAME (from f0; whisper, may run ~5 f early): Why -8 · Because -2 · it's 2 · gone 7 · up 9 · to 14 ·
// this 18 · point 21 · right 27 · (Sam) I 35.
// DURATION: the slot 3.879 -> 5.297 s (sequence frames 93-127) = 1.418 s x 23.976 = 34 frames (f0..f33).
//
// THE MOTION: f0 is cut 1's last frame pixel for pixel (CUT1_END_CAM, every column full, story clock S = CUT1_END_S
// + f so the dust and shimmer carry on). From f0 ONE damped pull-back (already moving at f0) eases the camera out
// about a fixed point up and right of Grok 4's top, so the staircase of 2023-25 columns stays big at the right while
// the $0 edge rises from y ~1658 to ~1020 and the whole decade of near-zero columns since 2012 slides in from the left,
// lying flat along the apron edge. Landed by f22 ("this point" 21): all 56 columns, 2012 to 2025, Grok 4's top at
// y ~255; then a living creep (the same pull-back, very slow), dust, shimmer, grain to f33. As the wide arrives the
// labels slide up in world space where the camera lands: the small title with its source line (f15), "2012" / "2025" under the row's ends (f18, once the left end is in frame), the sparse
// $100M-$300M scale in ink at the row's left end (f20).
// AMBER = the dollars (the training-cost fills); cream = the plates, glass hairlines, the type.
// Plan (data, geometry, AirCam mapping, the join cameras, TITLE): costChartPlan.ts. Pieces: costChartParts.tsx
// (both owned by cut 1, imported read-only).
//
// SOURCES: Epoch AI, "Notable AI Models" (https://epoch.ai/data/notable_ai_models.csv, downloaded 2026-10-28),
// frontier models, "Training compute cost (2023 USD)", all 56 rows (frontierCostData.ts), Epoch's estimates; first row
// Dropout (ImageNet) 2012-06-03 ($8), last row Grok 4 2025-07-09 ($387.8M): the years on screen are the data's.
// Lab marks: cut 1's (the clip's images/logos/, LOGOS_READY.md), redrawn as ink stamps.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, FONT_NUM, amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR, AirStage, type GroundSpec } from "../scott-aircraft-order/aircraftShared";
import { APRON, CHART_WIDE_CAM, CUT1_END_CAM, CUT1_END_S, GROUND, PX_PER_M, ROW_X0, ROW_X1, TITLE, airCamOf, dustRestFor, glassLen } from "./costChartPlan";
import { CostChart, chartTransform, type Look } from "./costChartParts";

export const FPS = 24000 / 1001;
export const DURATION = 34;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// --- the camera: one pull-back about a fixed point ----------------------------------------------------------
// From CUT1_END_CAM (A) to CHART_WIDE_CAM (B) as a pure zoom: the one world point P that sits at the same screen
// spot in both looks stays put, every other point travels in a straight line toward it (P is up and right of Grok 4's
// top, so the payoff column barely moves while the decade slides in from the left). k eases in log space.
// camCheck (museShared's points): maxV 55.5 px/f at f9, max |dv| 12.25 at f1 (the start from cut 1's creep; cut 1's
// own pull-back measured 101 / 12.5), slowest frame 1.9 px/f (the creep, no dead hold).
const A = CUT1_END_CAM;
const B = CHART_WIDE_CAM;
const LK = Math.log(B.k / A.k);
const PX = (A.x * A.k - B.x * B.k) / (A.k - B.k);
const PY = (A.y * A.k - B.y * B.k) / (A.k - B.k);
const SX = 540 + (PX - A.x) * A.k;
const SY = 960 + (PY - A.y) * A.k;
const lookAtP = (p: number): Look => {
  const k = A.k * Math.exp(LK * p);
  return { x: PX - (SX - 540) / k, y: PY - (SY - 960) / k, k };
};
/** progress p(f): a Beta(2,3)-shaped speed bump over T frames (moving from f0, peak ~f8, long settle) plus a slow
 *  creep VC per frame that carries through the hold; p(T) = 1 (= CHART_WIDE_CAM), the creep runs ~2 % past it. */
const T = 24;
const VC = 0.0025;
const W = 1 - VC * T;
const betaCdf = (x: number) => {
  const u = clamp01(x);
  return 6 * u * u - 8 * u * u * u + 3 * u * u * u * u;
};
export const progress = (f: number) => W * betaCdf(f / T) + VC * f;
export const lookAt = (f: number) => lookAtP(progress(f));
// the join: f0 must be cut 1's last look exactly
{
  const c = lookAt(0);
  if (Math.abs(c.x - A.x) > 1e-6 || Math.abs(c.y - A.y) > 1e-6 || Math.abs(c.k - A.k) > 1e-9) {
    throw new Error(`GoneUpToThisPoint: f0 look ${JSON.stringify(c)} != CUT1_END_CAM`);
  }
}

// --- the labels (world space where the wide lands, as TITLE in costChartPlan) ----------------------------------
const wy = (sy: number) => B.y + (sy - 960) / B.k;
const YEAR = { px: 38 / B.k, y: wy(1072), track: "-0.015em" } as const;
/** the sparse scale: $100M-$300M at the row's left end ($400M would crowd the title's source line), in ink: the
 *  haze behind it is light (cream measured ~1.2:1 there, ink 7.6-11.7:1) */
const SCALE = [100, 200, 300] as const;
const SCALE_PX = 28 / B.k;
const ease = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
const ENTER = { title: [15, 26], years: [18, 28], scale: [20, 30] } as const; // years once the row's left end is in frame
const enterAt = (f: number, [a, b]: readonly [number, number]) => clamp01((f - a) / (b - a));

/** the house text entrance in world space: slide up 24 screen px + fade + blur (screen px at the wide's k) */
const Rise: React.FC<{ e: number; k: number; children: React.ReactNode }> = ({ e, k, children }) => {
  const a = ease(e);
  if (a <= 0.001) return null;
  return (
    <g opacity={f3(a)} transform={`translate(0 ${f3(((1 - a) * 24) / k)})`} style={{ filter: a < 1 ? `blur(${f3((6 * (1 - a)) / k)}px)` : undefined }}>
      {children}
    </g>
  );
};

const Years: React.FC<{ k: number; e: number }> = ({ k, e }) => (
  <Rise e={e} k={k}>
    <g fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(YEAR.px)} fill={COLOR.inkCream} style={{ fontFeatureSettings: '"lnum" 1' }}>
      <text x={f3(ROW_X0)} y={f3(YEAR.y)} textAnchor="start" letterSpacing={YEAR.track}>
        2012
      </text>
      <text x={f3(ROW_X1)} y={f3(YEAR.y)} textAnchor="end" letterSpacing={YEAR.track}>
        2025
      </text>
    </g>
  </Rise>
);

const Scale: React.FC<{ k: number; e: number }> = ({ k, e }) => (
  <Rise e={e} k={k}>
    {SCALE.map((m) => {
      const y = GROUND - m * PX_PER_M;
      return (
        <g key={m}>
          <rect x={f3(ROW_X0)} y={f3(y - 1 / k)} width={f3(28 / k)} height={f3(2 / k)} fill={AIR_COLOR.ink} opacity={0.8} />
          <text x={f3(ROW_X0 + 38 / k)} y={f3(y + SCALE_PX * 0.36)} fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(SCALE_PX)} fill={AIR_COLOR.ink} style={{ fontFeatureSettings: '"lnum" 1' }}>
            {`$${m}M`}
          </text>
        </g>
      );
    })}
  </Rise>
);

/** The chart's small title at TITLE (costChartPlan; ChartTitle's layout, copied): Kräftig caps in cream, the source
 *  line in cream too (ChartTitle's cream-lo measured ~1.3:1 on the sky band there). */
const Title: React.FC<{ k: number; e: number }> = ({ k, e }) => (
  <Rise e={e} k={k}>
    <g fontFamily={FONT_LABEL} fill={COLOR.inkCream}>
      <text x={f3(TITLE.x)} y={f3(TITLE.y)} fontSize={f3(TITLE.px)} letterSpacing="0.06em">
        {TITLE.text}
      </text>
      <text x={f3(TITLE.x)} y={f3(TITLE.subY)} fontSize={f3(TITLE.subPx)} letterSpacing="0.06em">
        {TITLE.sub}
      </text>
    </g>
  </Rise>
);

const GROUND_SPEC: GroundSpec = { aprons: [APRON], joints: 7.5 };

const GoneUpToThisPoint: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = lookAt(f);
  const cam = airCamOf(look);
  const rest = dustRestFor(cam);
  return (
    <AirStage
      cam={cam}
      S={CUT1_END_S + f}
      rest={rest}
      ground={GROUND_SPEC}
      overlay={
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={chartTransform(look)}>
            <CostChart look={look} band={amberBandFor(look)} rise={(i) => glassLen(i)} open={() => 1} />
            <Years k={look.k} e={enterAt(f, ENTER.years)} />
            <Scale k={look.k} e={enterAt(f, ENTER.scale)} />
            <Title k={look.k} e={enterAt(f, ENTER.title)} />
          </g>
        </svg>
      }
    />
  );
};

export default GoneUpToThisPoint;
