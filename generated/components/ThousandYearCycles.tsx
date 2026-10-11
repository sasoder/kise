// ---------------------------------------------------------------------------
// ThousandYearCycles (plague clip, Dwarkesh Patel with Kyle Harper; sequence
// 34.468 - 38.772 s). Cut 1 of the two-cut chart; cut 2 is ComesAndGoes, on the
// same chart (ThousandYearCyclesShared).
//
// CHECK LINE: "Plague has hit people in three bursts many centuries apart;
// nothing fills the gaps: not every 500 years, not every 10."
//
// SPOKEN: "these 1,000-year cycles, basically, why is it not 500 years? Why is
// it not 10 years?"   29.97 fps, f = round((t - 34.468) * 29.97):
//   these f0 · one f5 · thousand f11 · year f21 · cycles f30 · basically f55 ·
//   why f69 · is it f74 · not f79 · five hundred f83 · years f91 · Why f99 ·
//   is it f102 · not f107 · ten f111 · years f116 · speech ends f129.
// DURATION = 129 + 6 = 135.
//
// MOTION (one continuous move). On f0 the camera is already gliding right along
// the timeline, close on the time axis: the 541 burst stands left of centre and
// the orange tip is travelling the flat baseline at constant speed through the
// empty centuries; it shoots up at 1347 (f28-31), runs on through the decaying
// waves, the flat and the 1894 burst (f57-60) to today (f66) while the camera,
// pulling back from the first frame, opens to the whole 1-2100 ruler (~f56). Then, in the wide framing, dashed cream
// ghost bursts (outline + a very light hatch) are drawn where a 500-year clock
// from 541 would put them (1041, 1541, 2041; f72-92). On the second "Why" (f99)
// the time axis opens on 1000-1400 (the height stays): the 1041 ghost at the
// left, the solid 1347 burst at the right, and between them one dashed cream
// tick every ten years stands up, one after another, left to right (f104-124).
// Hold: slow creep, a highlight climbing the 1347 burst. The cut therefore ends
// CLOSE; ComesAndGoes opens on the same chart in its own wide framing.
//
// WHAT IS SHOWN, AND ITS SOURCE: only the onset years 541, 1347, 1894 and the
// spans of the three pandemics are data; all amplitudes are SCHEMATIC (equal
// peaks). The ghosts and the comb are hypothetical (dashed): 541 + 500n and
// every 10th year. See ThousandYearCyclesShared for the dates and sources (WHO
// plague fact sheet; Stenseth et al. 2008 PLoS Med; Spyrou et al. 2022 Nature).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { type CamKey, DARK, FPS as KIT_FPS, INK, Label, Page } from "./plagueShared";
import {
  BASE_Y,
  ChartSvg,
  Highlight,
  PeakLabels,
  RISE,
  Ruler,
  TODAY,
  Trace,
  wx,
  arcTable,
  burstH,
  chartCam,
  clamp01,
  drawYear,
  pathBetween,
  smoothstep,
  sx,
  sy,
  traceH,
} from "./ThousandYearCyclesShared";

export const FPS = KIT_FPS;
export const DURATION = 135;

export const schema = z.object({
  /** opacity of the dashed 500-year ghost bursts */
  ghostOpacity: z.number(),
  /** opacity of the dashed 10-year comb */
  combOpacity: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ ghostOpacity: 0.9, combOpacity: 0.75 });

// the tip: constant speed in the draw parameter; each sharp rise takes 3 frames
const TIP_V = (1347 - 750) / 28; // years per frame: at 750 on f0, at 1347 on f28
const RISE_EQ = 3 * TIP_V;
// (the draw parameter already carries the 541 rise, hence the + RISE_EQ)
const tipYear = (f: number) => Math.min(TODAY, drawYear(750 + RISE_EQ + TIP_V * f, RISE_EQ));

const CLOSE_YEAR = 1195;
const CLOSE_KX = 5.6;
// the camera (x = world x on the frame centre, k = time-axis zoom, y = height zoom): it glides right and
// pulls back from the first frame, slower than the tip, so the 541 burst stays in at the left while the
// empty stretch between it and the tip grows (keys sit ~4 f early: the damper trails)
const CAM: CamKey[] = [
  { f: -4, x: 398.7, k: 4.5, y: 1.2 },
  { f: 4, x: 432, k: 3.5, y: 1.2 },
  { f: 12, x: 480, k: 2.45, y: 1.17 },
  { f: 20, x: 520, k: 1.9, y: 1.12 },
  { f: 30, x: 538, k: 1.45, y: 1.06 },
  { f: 50, x: 540, k: 1, y: 1 },
  { f: 96, x: 540, k: 1.012, y: 1.01 },
  // "Why is it not 10 years?": the time axis opens on 1000-1400 (the height stays)
  { f: 111, x: wx(CLOSE_YEAR), k: CLOSE_KX, y: 1.012 },
  { f: 134, x: wx(CLOSE_YEAR + 4), k: CLOSE_KX * 1.03, y: 1.02 },
];

// "why is it not 500 years?": 541 + 500n, drawn from the baseline up
const GHOSTS = [
  { onset: 1041, from: 72 },
  { onset: 1541, from: 78 },
  { onset: 2041, from: 84 },
];
const GHOST_SPAN = 150;
const GHOST_FRAMES = 8;
// "why is it not 10 years?": one dashed tick every 10 years, standing up one after another, left to right at a
// steady rate, in the close framing only (at the wide scale ten years is 4 px: it could only be a band)
const COMB = { from: 104, to: 124, yearA: 990, yearB: 1410 };
const COMB_GROW = 4; // frames each tick takes to stand up
const COMB_H = 170;
// hold: a highlight climbs the 1347 burst
const CLOSE_ARC = arcTable(CLOSE_KX, 1);
const SHIMMER = { from: 120, s0: CLOSE_ARC.sOfYear(1338), v: 52 };
// the century numerals the opened axis needs
const CLOSE_NUMERALS = [1100, 1200, 1300];

const ThousandYearCycles: React.FC<Props> = ({ ghostOpacity, combOpacity }) => {
  const frame = useCurrentFrame();
  const cam = chartCam(CAM, frame);
  const tip = tipYear(frame);

  // the comb
  const perFrame = (COMB.yearB - COMB.yearA) / (COMB.to - COMB.from);
  const front = COMB.yearA + (frame - COMB.from) * perFrame;
  let comb = "";
  if (frame >= COMB.from) {
    for (let yr = COMB.yearA; yr <= COMB.yearB; yr += 10) {
      const g = smoothstep(clamp01((front - yr) / (COMB_GROW * perFrame) + 1));
      if (g <= 0) break;
      const x = sx(cam, yr).toFixed(2);
      comb += `M${x},${BASE_Y}V${(BASE_Y - COMB_H * cam.ky * g).toFixed(2)}`;
    }
  }

  return (
    <Page>
      <ChartSvg>
        <Ruler cam={cam} />
        {CLOSE_NUMERALS.map((yr) => (
          <Label key={yr} x={sx(cam, yr)} y={BASE_Y + 30} size={30} spacing={0.04} appear={104} frame={frame}>
            {yr}
          </Label>
        ))}
        {comb ? <path d={comb} fill="none" stroke={INK} strokeOpacity={combOpacity} strokeWidth={3} strokeDasharray="11 7" /> : null}
        {GHOSTS.map((g) => {
          const q = clamp01((frame - g.from) / GHOST_FRAMES);
          if (q <= 0) return null;
          const to = q < 0.35 ? g.onset + (RISE * q) / 0.35 : g.onset + RISE + ((GHOST_SPAN - RISE) * (q - 0.35)) / 0.65;
          const h = (yr: number) => burstH(yr, g.onset, g.onset + GHOST_SPAN, 3);
          const d = pathBetween(cam, h, g.onset, to);
          const x0 = sx(cam, g.onset);
          const x1 = sx(cam, to);
          const top = sy(cam, 1) - 10;
          return (
            <g key={g.onset}>
              <defs>
                <pattern id={`tycGhostHatch${g.onset}`} patternUnits="userSpaceOnUse" width={12} height={12} patternTransform={`translate(${x0.toFixed(2)} ${BASE_Y}) rotate(45)`}>
                  <line x1={0} y1={0} x2={0} y2={12} stroke={INK} strokeWidth={4} />
                </pattern>
                <clipPath id={`tycGhostArea${g.onset}`}>
                  <path d={`${d}L${x1.toFixed(2)},${BASE_Y}L${x0.toFixed(2)},${BASE_Y}Z`} />
                </clipPath>
              </defs>
              <rect x={x0 - 2} y={top} width={x1 - x0 + 4} height={BASE_Y - top} fill={`url(#tycGhostHatch${g.onset})`} opacity={0.15} clipPath={`url(#tycGhostArea${g.onset})`} />
              <path d={d} fill="none" stroke={DARK} strokeOpacity={0.4} strokeWidth={8} strokeDasharray="14 10" strokeLinejoin="round" />
              <path d={d} fill="none" stroke={INK} strokeOpacity={ghostOpacity} strokeWidth={5} strokeDasharray="14 10" strokeLinejoin="round" />
            </g>
          );
        })}
        <Trace cam={cam} toYear={tip} />
        {frame >= SHIMMER.from ? (
          <Highlight cam={cam} h={traceH} yearOfS={CLOSE_ARC.yearOfS} s={SHIMMER.s0 + SHIMMER.v * (frame - SHIMMER.from)} len={170} minYear={1338} />
        ) : null}
        <PeakLabels cam={cam} frame={frame} appear={[-30, 29, 57]} />
      </ChartSvg>
    </Page>
  );
};

export default ThousandYearCycles;
