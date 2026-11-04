// believeState: cut B's (BelieveTheSolarCurve) clocks, camera track and chart state, on top of cut A's last frame.
// B's f0 is cut A's f60 pixel for pixel: the camera starts at CUT_A_END_CAM, the chart at CUT_A_END, the story clock at
// CUT_A_END_S. Everything here is a pure function of B's frame (the planner and the probe import it too).
import { nuclearCamAt, nuclearProject, nuclearTrack, type NuclearCam, type NuclearGlide } from "../scott-nolan-uranium/nuclearWorld";
import { c01 } from "../scott-nolan-wind/energyWorld";
import { SPAN } from "./costData";
import { AXIS_TOP, COST_AXIS, YEAR_LABEL, chartX, pointAt, type CostChartProps } from "./costCurveWorld";
import { CUT_A_END, CUT_A_END_CAM, CUT_A_END_S } from "./cutAState";

export const CUT_B_DURATION = 113;
/** B's story clock: S = CUT_B_S0 + f, so B's f0 carries A's f60 grain and glint */
export const CUT_B_S0 = CUT_A_END_S;
/** solar's first data year (1975) and the shared start (2010) */
export const Y_FIRST = SPAN.solar[0];
export const Y_START = CUT_A_END.solar.from;
export const Y_END = CUT_A_END.solar.to;

const ss = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const span = (f: number, a: number, b: number) => c01((f - a) / (b - a));

/**
 * The solar line grows back in time: its `from` runs 2010 -> 1975, drawn up-left by its tip. It leaves A's settled
 * frame from rest (smoothstep), so the tip starts on f1 and lands on 1975 on DRAW.f1 ("curve" 26).
 */
export const DRAW = { f0: 0, f1: 27, warp: 1.1 } as const;
export const solarFromAt = (f: number) => Y_START + (Y_FIRST - Y_START) * ss(Math.pow(span(f, DRAW.f0, DRAW.f1), DRAW.warp));

/**
 * The amber spread (director, rev 1): on "believe" (2) amber, the sun's power, starts spreading along the solar line from
 * its 2010 point and stays. CostLine's `amber` front is a year and everything left of it is amber, so the line growing back
 * to 1975 is drawn amber by its tip, while the front runs right over 2010 -> 2025 and reaches the panel's end by ~f30.
 */
export const WAVE = { f0: 1, f1: 30, from: Y_START - 0.75, to: Y_END + 2 } as const;
export const amberAt = (f: number): number => WAVE.from + (WAVE.to - WAVE.from) * ss(span(f, WAVE.f0, WAVE.f1));

/** "...on the battery cost curve": the battery line and its cell (board tone, rev 1) step down the tone ladder toward the
 * ground (`dim` 0 board -> 1 dark), settled just after "battery" (86), as the push-in lands */
export const DIM = { f0: 78, f1: 90, to: 0.45 } as const;
export const batteryDimAt = (f: number) => DIM.to * ss(span(f, DIM.f0, DIM.f1));

/** the 1975 label's entrance (slides up out of the board while fading in) once the tip is there and the camera has it */
export const LABEL_1975 = { f0: 25, f1: 37 } as const;

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERA: one continuous pull-back and glide from A's last frame (A's 3/4 view). The first glide eases back, up and
// left so the whole 51-year line fits by ~f34; the second keeps it gliding (a slow swing round toward the front and a
// small settle in) to the resolved frame: the chart across the frame, everything above the caption band.
// ---------------------------------------------------------------------------------------------------------------------
export const CUT_B_GLIDES: NuclearGlide[] = [
  // the pull-back: back, up and left until the whole 51-year line fits (~f30)
  { f0: -9, f1: 30, to: { tx: -345, ty: 600, tz: 0, d: 6500, pitch: 23, cx: 540, cy: 680 } },
  // "I haven't seen data that's as compelling on the battery cost curve": glide right and push in on 2010-2025, arriving
  // ~f88: the amber record runs on up-left out of frame, the battery line begins at 2010 with nothing before it
  { f0: 32, f1: 90, to: { tx: 170, ty: 380, tz: -30, d: 3000, yaw: CUT_A_END_CAM.yaw + 1, pitch: 22, cy: 625 } },
  // the living drift to the last frame
  { f0: 80, f1: 170, to: { tx: 185, d: 2900 } },
];
const TRACK = nuclearTrack(CUT_A_END_CAM, CUT_B_GLIDES, CUT_B_DURATION + 2);
export const cutBCamAt = (f: number): NuclearCam => nuclearCamAt(TRACK, f);

/** screen px per world unit at the chart's 2010 foot (the year labels' scale) */
const kAt = (cam: NuclearCam) => nuclearProject(cam, [chartX(Y_START), 0, 0]).s;
const K_A = kAt(CUT_A_END_CAM);
/** the year labels hold their screen size through the pull-back (A's cap at A's scale), eased with the camera */
export const yearCapAt = (f: number) => Math.max(YEAR_LABEL.CAP, (YEAR_LABEL.CAP * K_A) / kAt(cutBCamAt(f)));
/** and their gap from the rail grows with them, so the bigger word still clears the rail as it does in A */
export const yearGapAt = (f: number) => (YEAR_LABEL.GAP * yearCapAt(f)) / YEAR_LABEL.CAP;
/** COST holds its screen size the same way */
export const costCapAt = (f: number) => (COST_AXIS.CAP * yearCapAt(f)) / YEAR_LABEL.CAP;

/**
 * The cost axis (director, rev 2) stays at the chart's left edge: as the solar line grows back, the L's corner slides
 * out with the rail's left end (one eased slide, the tip's own clock) and the rod rises with the tip, its top always
 * COST_AXIS.OVER above the line's first point, so COST rides above the growing start and lands over 1975.
 */
export const axisAt = (f: number): NonNullable<CostChartProps["axis"]> => {
  const from = solarFromAt(f);
  return { ...CUT_A_END.axis, year: from, top: Math.max(AXIS_TOP, pointAt("solar", from)[1] + COST_AXIS.OVER), cap: costCapAt(f) };
};

/** the chart at B's frame f (spread into <CostChart S={S} {...cutBChartAt(f)} />) */
export const cutBChartAt = (f: number): Omit<CostChartProps, "S"> => {
  const from = solarFromAt(f);
  return {
    ...CUT_A_END,
    solar: { from, to: CUT_A_END.solar.to },
    battery: { ...CUT_A_END.battery },
    baseline: { from: Math.min(CUT_A_END.baseline.from, from), to: CUT_A_END.baseline.to },
    years: { ...CUT_A_END.years, [Y_FIRST]: ss(span(f, LABEL_1975.f0, LABEL_1975.f1)) },
    dim: { ...CUT_A_END.dim, battery: batteryDimAt(f) },
    amber: { ...CUT_A_END.amber, solar: amberAt(f) },
    cap: yearCapAt(f),
    yearGap: yearGapAt(f),
    axis: axisAt(f),
  };
};
