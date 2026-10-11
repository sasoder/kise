// ---------------------------------------------------------------------------
// ComesAndGoes (plague clip, Dwarkesh Patel with Kyle Harper; sequence
// 41.108 - 44.645 s). Cut 2 of the two-cut chart: the SAME chart as
// ThousandYearCycles (ThousandYearCyclesShared), 2.3 s later in the edit.
//
// CHECK LINE: "Nobody can say when the next burst comes: past today the line
// is a blank."
//
// SPOKEN: "we don't have a great understanding of, like, why the plague comes
// and goes."   29.97 fps, f = round((t - 41.108) * 29.97):
//   we f0 · don't f3 · have f9 · a f17 · great f21 · understanding f27 ·
//   of f40 · like f57 · why f60 · the f66 · plague f71 · comes f78 · and f87 ·
//   goes f91 · speech ends f106.
// DURATION = 106 + 6 = 112.
//
// MOTION (one continuous move). Opens on cut 1's held wide framing without the
// ghosts and the comb, the camera already gliding right and stretching the time
// axis toward the present (landed ~f48, then a creep). A brighter stretch of
// the orange trace travels with it at constant speed: up and down the 1894
// burst, out along the flat line to the unlabelled TODAY tick (f72), and on as
// the tip that draws the line's continuation: DASHED orange, into the future.
// On "comes and goes" a dashed swell rises out of that line, sinks, and rises
// again further right, still wandering at the cut; it never becomes solid.
//
// WHAT IS SHOWN, AND ITS SOURCE: the chart of ThousandYearCyclesShared (onset
// years and spans are data, amplitudes schematic; WHO plague fact sheet;
// Stenseth et al. 2008 PLoS Med; Spyrou et al. 2022 Nature). TODAY = 2026.
// Everything right of today is hypothetical and drawn dashed: it is no
// forecast, its place and height are arbitrary and keep moving.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, type CamKey, DARK, FPS as KIT_FPS, Page, runCamera } from "./plagueShared";
import {
  type ChartCam,
  ChartSvg,
  Highlight,
  PX_PER_YEAR,
  PeakLabels,
  Ruler,
  TODAY,
  Trace,
  WIDE_HELD,
  YEAR_B,
  arcTable,
  pathBetween,
  traceH,
  wx,
} from "./ThousandYearCyclesShared";

export const FPS = KIT_FPS;
export const DURATION = 112;

export const schema = z.object({
  /** peak height of the first future swell, as a fraction of a real peak */
  swell: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ swell: 0.62 });

// the camera: the kit's damped track carries a progress u (x channel), the
// time-axis zoom (k) and the height zoom (y). The focus year slides from where
// it sits in the wide framing to the frame centre as u goes 0 -> 1, so it never
// leaves the frame while the time axis stretches.
const FOCUS = 1980;
const KX_END = 6.5;
const KY_END = 1.1;
const KEYS: CamKey[] = [
  { f: 0, x: 0, k: WIDE_HELD.kx, y: WIDE_HELD.ky },
  { f: 44, x: 1, k: KX_END, y: KY_END },
  { f: 111, x: 1.05, k: KX_END * 1.06, y: KY_END * 1.015 },
];
const camAt = (frame: number): ChartCam => {
  // renormalised so frame 0 is EXACTLY cut 1's held wide framing (the damper is already moving there)
  const c0 = runCamera(KEYS, 0);
  const c = runCamera(KEYS, frame);
  const u = (c.x - c0.x) / (1 - c0.x);
  const kx = WIDE_HELD.kx * Math.exp(((Math.log(c.k) - Math.log(c0.k)) * Math.log(KX_END / WIDE_HELD.kx)) / Math.log(KX_END / c0.k));
  const ky = WIDE_HELD.ky + ((c.y - c0.y) * (KY_END - WIDE_HELD.ky)) / (KY_END - c0.y);
  const off0 = (wx(FOCUS) - WIDE_HELD.x) * WIDE_HELD.kx; // the focus year's offset from the frame centre at f0
  return { x: wx(FOCUS) - (off0 * (1 - u)) / kx, kx, ky };
};

// the highlight: constant speed along the trace, measured in the landed framing
const ARC = arcTable(KX_END, KY_END);
const T_TODAY = 72;
const HL_V = (ARC.sOfYear(TODAY) - ARC.sOfYear(1800)) / T_TODAY; // at 1800 on f0
const hlS = (f: number) => ARC.sOfYear(TODAY) + HL_V * (f - T_TODAY);

// the future: two slow swells on the dashed line, steep on the left like a real onset
const bump = (yr: number, c: number) => {
  const z = (yr - c) / (yr < c ? 4 : 11);
  return Math.exp(-0.5 * z * z);
};
const gauss = (f: number, c: number, w: number) => Math.exp(-0.5 * ((f - c) / w) ** 2);
const futureH = (yr: number, f: number, swell: number) =>
  swell * gauss(f, 85, 5.5) * bump(yr, 2047 + 0.5 * (f - 85)) + swell * 0.8 * gauss(f, 108, 7) * bump(yr, 2066 + 0.6 * (f - 108));

const ComesAndGoes: React.FC<Props> = ({ swell }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = hlS(frame);
  const h = (yr: number) => (yr <= TODAY ? traceH(yr) : futureH(yr, frame, swell));
  // the dashed continuation is drawn by the highlight's centre
  const futureTip = Math.min(YEAR_B, TODAY + (s - ARC.sOfYear(TODAY)) / (PX_PER_YEAR * KX_END));
  const dFuture = futureTip > TODAY ? pathBetween(cam, h, TODAY, futureTip) : "";

  return (
    <Page>
      <ChartSvg>
        <Ruler cam={cam} />
        <Trace cam={cam} toYear={TODAY} />
        {dFuture ? (
          <g fill="none" strokeLinejoin="round" strokeDasharray="17 12">
            <path d={dFuture} stroke={DARK} strokeOpacity={0.5} strokeWidth={8.5} />
            <path d={dFuture} stroke={ACCENT} strokeWidth={5} />
          </g>
        ) : null}
        <Highlight cam={cam} h={h} yearOfS={ARC.yearOfS} s={s} len={130} maxYear={Math.max(TODAY, futureTip)} />
        <PeakLabels cam={cam} frame={frame} appear={[-30, -30, -30]} />
      </ChartSvg>
    </Page>
  );
};

export default ComesAndGoes;
