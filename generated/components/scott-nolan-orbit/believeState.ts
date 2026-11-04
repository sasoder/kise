// believeState: cut B's (BelieveTheSolarCurve) clocks, camera track and chart state, on top of cut A's last frame.
// B's f0 is cut A's f60 pixel for pixel: the camera starts at CUT_A_END_CAM, the chart at CUT_A_END, the story clock at
// CUT_A_END_S. Everything here is a pure function of B's frame (the planner and the probe import it too).
// rev 1 (user: "slightly more dynamic"): the line grows back faster, a "believe" pulse runs the whole solar curve and lands
// on the panel on "curve", the camera orbits round and rises as it pushes in, and the battery curve loses conviction.
import { nuclearCamAt, nuclearProject, nuclearTrack, type NuclearCam, type NuclearGlide } from "../scott-nolan-uranium/nuclearWorld";
import { c01 } from "../scott-nolan-wind/energyWorld";
import { SPAN } from "./costData";
import { AXIS_TOP, COST_AXIS, YEAR_LABEL, chartX, glintAt, marksAt, pointAt, rowsOf, type CostChartProps, type Series } from "./costCurveWorld";
import { CUT_A_END, CUT_A_END_CAM, CUT_A_END_S } from "./cutAState";
import type { Pop } from "./believePulse";
import type { V3 } from "../scott-nolan-wind/energyWorld";

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
 * The solar line grows back in time: its `from` runs 2010 -> 1975, drawn up-left by its tip, amber as it is drawn. It
 * leaves A's settled frame from rest and lands on 1975 on DRAW.f1 ("solar" 12), so the pulse can run the whole record.
 */
export const DRAW = { f0: 0, f1: 16, warp: 1.1 } as const;
export const solarFromAt = (f: number) => Y_START + (Y_FIRST - Y_START) * ss(Math.pow(span(f, DRAW.f0, DRAW.f1), DRAW.warp));

/**
 * "I believe the solar cost curve": the pulse. A hot amber head leaves the 1975 end as the tip lands and runs the whole
 * curve down to 2025 at an even pace (eased only into the landing), kicking each bead it passes (a little bigger and
 * hotter, settling over KICK frames, no overshoot). It reaches the 2025 tip on "curve" (26), where the panel takes the hit.
 */
export const PULSE = { f0: 15, f1: 26, from: Y_FIRST, to: Y_END, KICK: 6, GROW: 0.85 } as const;
const pulseU = (f: number) => {
  const t = span(f, PULSE.f0, PULSE.f1);
  // nearly constant speed, a soft landing over the last fifth
  return t < 0.8 ? t * 0.9 : 0.72 + 0.28 * (1 - Math.pow(1 - (t - 0.8) / 0.2, 2));
};
/** the head's year, or undefined before it leaves and once it has landed */
export const pulseHeadAt = (f: number): number | undefined => (f < PULSE.f0 || f >= PULSE.f1 ? undefined : PULSE.from + (PULSE.to - PULSE.from) * pulseU(f));
/** the frame the head passes a year (inverse of the head's path, by search) */
const passFrame = (year: number) => {
  let lo: number = PULSE.f0;
  let hi: number = PULSE.f1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (PULSE.from + (PULSE.to - PULSE.from) * pulseU(m) < year) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
const SOLAR_ROWS = rowsOf("solar");
const PASS = SOLAR_ROWS.map((r) => passFrame(r.year));
/** each solar bead's kick at frame f (rise over ~1 frame as the head arrives, settle over KICK frames) */
export const popsAt = (f: number): Pop[] =>
  PASS.map((t, i) => {
    const d = f - t;
    const last = i === PASS.length - 1;
    const k = d < -1 ? 0 : d < 0 ? 1 + d : Math.exp(-d / (last ? PULSE.KICK * 1.6 : PULSE.KICK));
    const e = k < 0.01 ? 0 : k;
    return { grow: PULSE.GROW * e * (last ? 1.25 : 1), hot: e };
  });

/**
 * Amber: the growth back to 1975 is drawn amber (the front holds just left of 2010, so A's cream 2010-2025 stays cream),
 * then the pulse carries the front: cream turns amber behind the head over 2010 -> 2025, all amber when it lands.
 */
export const amberAt = (f: number): number => {
  const h = pulseHeadAt(f);
  const hold = Y_START - 0.75;
  if (f >= PULSE.f1) return Y_END + 2;
  return h === undefined ? hold : Math.max(hold, h);
};

/** the panel takes the pulse: a short lift and settle (no overshoot) and a quick glint across its cells */
export const LAND = { f: PULSE.f1, LIFT: 14, RISE: 2.5, SETTLE: 5.5 } as const;
export const panelLiftAt = (f: number) => {
  const d = f - LAND.f + 1;
  if (d <= 0) return 0;
  const u = d / LAND.RISE;
  return LAND.LIFT * (u < 1 ? Math.sin((u * Math.PI) / 2) : Math.exp(-(d - LAND.RISE) / LAND.SETTLE));
};
/**
 * The panel's glint: the world's slow pass on the story clock (glintAt), plus one extra lap run fast through the landing,
 * so the highlight sweeps the cells right as the pulse arrives; continuous (no jump), back to the slow pass after.
 */
const GLINT_LAP = { f0: 17, f1: 34 } as const;
/** and a soft nudge late on, so the slow pass is crossing the cells (not waiting off the panel) through the end frame */
const GLINT_END = { f0: 60, f1: 100, by: 0.8 } as const;
export const glintB = (f: number) => {
  const g = glintAt(CUT_B_S0 + f) + 2.4 * ss(span(f, GLINT_LAP.f0, GLINT_LAP.f1)) + GLINT_END.by * ss(span(f, GLINT_END.f0, GLINT_END.f1));
  return ((((g + 0.6) % 2.4) + 2.4) % 2.4) - 0.6;
};

/**
 * "...on the battery cost curve": the battery curve loses conviction, in steps that land on "battery" (86) to "curve"
 * (100). From "data" (53) its beads thin; from "compelling" its tube breaks into a sparser dotted line; on "battery" its
 * tone steps down to ~0.45 toward the ground and the cell at its tip sags and tips a little. Still a falling, readable
 * line: the evidence is weaker, the price did not rise.
 */
export const DOUBT = {
  BEAD: { f0: 54, f1: 96, to: 0.62 },
  TUBE: { f0: 64, f1: 98, to: 0.7 },
  DASH: { f0: 66, f1: 98, to: 0.9 },
  DIM: { f0: 80, f1: 96, to: 0.45 },
  SAG: { f0: 84, f1: 102, to: 5, tilt: 6 },
} as const;
const doubt = (f: number, k: { f0: number; f1: number }) => ss(span(f, k.f0, k.f1));
export const batteryDimAt = (f: number) => DOUBT.DIM.to * doubt(f, DOUBT.DIM);
export const batteryLookAt = (f: number) => ({
  beadScale: 1 + (DOUBT.BEAD.to - 1) * doubt(f, DOUBT.BEAD),
  tubeScale: 1 + (DOUBT.TUBE.to - 1) * doubt(f, DOUBT.TUBE),
  dash: DOUBT.DASH.to * doubt(f, DOUBT.DASH),
});
/** the cell's sag (world units at A's object size: scaled with the objects) and tip (degrees, its + end dips) */
export const batterySagAt = (f: number) => DOUBT.SAG.to * doubt(f, DOUBT.SAG);
export const batteryTiltAt = (f: number) => DOUBT.SAG.tilt * doubt(f, DOUBT.SAG);

/** the 1975 label's entrance (slides up out of the board while fading in) once the tip is there and the camera has it */
export const LABEL_1975 = { f0: 12, f1: 23 } as const;

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERA: one continuous move from A's last frame. It pulls back, up and left with the growth so the whole record is
// in shot while the pulse runs (~f14-26); then, without a stop, it orbits round to the right (yaw ~20 deg further) and
// rises while it pushes in on 2010-2025, so the lanes and the objects show their depth, arriving ~f88; then drifts on.
// ---------------------------------------------------------------------------------------------------------------------
export const CUT_B_GLIDES: NuclearGlide[] = [
  { f0: -8, f1: 16, to: { tx: -345, ty: 600, tz: 0, d: 7300, pitch: 23, cx: 504, cy: 735 } },
  { f0: 24, f1: 92, to: { tx: 190, ty: 360, tz: -30, d: 3300, yaw: CUT_A_END_CAM.yaw - 18, pitch: 25, cx: 437, cy: 640 } },
  { f0: 84, f1: 180, to: { tx: 205, d: 3200, yaw: CUT_A_END_CAM.yaw - 21 } },
];
const TRACK = nuclearTrack(CUT_A_END_CAM, CUT_B_GLIDES, CUT_B_DURATION + 2);
export const cutBCamAt = (f: number): NuclearCam => nuclearCamAt(TRACK, f);

/** screen px per world unit at the chart's 2010 foot (the year labels' scale) */
const kAt = (cam: NuclearCam) => nuclearProject(cam, [chartX(Y_START), 0, 0]).s;
const K_A = kAt(CUT_A_END_CAM);
/** A's end sizes (rev 3: 1 / 0.72 of the world defaults, so A's labels and objects keep their px size) */
const CAP_A = CUT_A_END.cap ?? YEAR_LABEL.CAP;
const GAP_A = CUT_A_END.yearGap ?? YEAR_LABEL.GAP;
const COST_A = CUT_A_END.axis?.cap ?? COST_AXIS.CAP;
const MARK_A = CUT_A_END.markScale ?? 1;
/** the year labels hold their screen size through the pull-back (A's cap at A's scale), eased with the camera */
export const yearCapAt = (f: number) => Math.max(CAP_A, (CAP_A * K_A) / kAt(cutBCamAt(f)));
/** and their gap from the rail grows with them, so the bigger word still clears the rail as it does in A */
export const yearGapAt = (f: number) => (GAP_A * yearCapAt(f)) / CAP_A;
/** COST holds its screen size the same way */
export const costCapAt = (f: number) => (COST_A * yearCapAt(f)) / CAP_A;
/** and so do the two objects (they grow in px once the push-in comes closer than A) */
export const markScaleAt = (f: number) => (MARK_A * yearCapAt(f)) / CAP_A;

/**
 * The cost axis stays at the chart's left edge: as the solar line grows back, the L's corner slides out with the rail's
 * left end (the tip's own clock) and the rod rises with the tip, its top always COST_AXIS.OVER above the line's first
 * point, so COST rides above the growing start and lands over 1975.
 */
export const axisAt = (f: number): NonNullable<CostChartProps["axis"]> => {
  const from = solarFromAt(f);
  return { ...CUT_A_END.axis, year: from, top: Math.max(AXIS_TOP, pointAt("solar", from)[1] + COST_AXIS.OVER), cap: costCapAt(f) };
};

/** the chart at B's frame f (spread into <CostChart S={S} {...cutBChartAt(f)} />); B draws the two objects itself */
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
    markScale: markScaleAt(f),
    line: { battery: batteryLookAt(f) },
    marks: false,
  };
};

/** the objects at B's frame f: CostChart's places on A's last frame, plus the panel's lift and the cell's sag */
export const cutBMarksAt = (f: number): { at: Record<Series, V3>; scale: number; lift: number; sag: number; tilt: number; glint: number; dim: Partial<Record<Series, number>> } => {
  const scale = markScaleAt(f);
  return {
    at: marksAt(CUT_A_END.solar.to, CUT_A_END.battery.to, scale),
    scale,
    lift: panelLiftAt(f) * scale,
    sag: batterySagAt(f) * scale,
    tilt: batteryTiltAt(f),
    glint: glintB(f),
    dim: { ...CUT_A_END.dim, battery: batteryDimAt(f) },
  };
};
