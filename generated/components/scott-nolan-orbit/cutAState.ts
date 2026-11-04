// cutAState: cut A's (BothComingDown) drawing clock, camera track and last-frame state, exported so cut B
// (BelieveTheSolarCurve) opens on cut A's last frame pixel for pixel: CUT_A_END_CAM is the camera on f60, CUT_A_END the
// chart there (both curves 2010 -> 2025, both years in, the objects at the 2025 tips), S = CUT_A_S0 + 60.
import { nuclearCamAt, nuclearTrack, type NuclearCam, type NuclearGlide } from "../scott-nolan-uranium/nuclearWorld";
import { c01 } from "../scott-nolan-wind/energyWorld";
import { COST_AXIS, YEAR_LABEL, type CostChartProps } from "./costCurveWorld";

export const CUT_A_DURATION = 61;
/** cut A's story clock at its f0 (S = CUT_A_S0 + f): grain and the panel's glint run on it */
export const CUT_A_S0 = 600;
/** the stage's board texture scale and light pool, fixed for the cut (cut B passes the same to continue the frame) */
export const CUT_A_BOARD_UNITS = 1000;
export const CUT_A_POOL = { x: 540, y: 766, strength: 0.95 } as const;

/**
 * The tips' year at frame f: both curves draw together, already moving on f0 (2010.37), slightly accelerating into the
 * plunge, easing into 2025 on f44 ("cost" 37, "curve" 47). A smoothstep entered part way, so it starts with speed.
 */
export const CUT_A_DRAW = { y0: 2010, y1: 2025, pre: 1.5, f1: 44, t0: 0.15 } as const;
export const cutAYearAt = (f: number) => {
  const D = CUT_A_DRAW;
  const S = (t: number) => t * t * (3 - 2 * t);
  const t = c01((f + D.pre) / (D.f1 + D.pre));
  const u = D.t0 + (1 - D.t0) * t;
  return D.y0 + (D.y1 - D.y0) * ((S(u) - S(D.t0)) / (1 - S(D.t0)));
};
/**
 * rev 2: the year labels' entrances (slide up out of the board while fading in), each wholly in frame and clear of the
 * caption bands: 2010 with the axis while the start is in view, 2025 as the camera brings that end in.
 */
export const CUT_A_YEARS = { 2010: [6, 16], 2025: [31, 41] } as const;
/** rev 2: the cost axis draws up from the rail (grow) and COST comes in at its top */
export const CUT_A_AXIS = { grow: [2, 13], cost: [9, 19] } as const;
export const cutAAxisAt = (f: number) => ({
  year: 2010,
  cap: COST_AXIS.CAP / CUT_A_REFRAME.s,
  grow: c01((f - CUT_A_AXIS.grow[0]) / (CUT_A_AXIS.grow[1] - CUT_A_AXIS.grow[0])),
  t: c01((f - CUT_A_AXIS.cost[0]) / (CUT_A_AXIS.cost[1] - CUT_A_AXIS.cost[0])),
});
export const cutAYearsAt = (f: number): Record<number, number> => ({
  2010: c01((f - CUT_A_YEARS[2010][0]) / (CUT_A_YEARS[2010][1] - CUT_A_YEARS[2010][0])),
  2025: c01((f - CUT_A_YEARS[2025][0]) / (CUT_A_YEARS[2025][1] - CUT_A_YEARS[2025][0])),
});

/**
 * The camera (rev 2, 3/4 view: pitch 20, yaw -24 -> -14): opens on the left of the graph at its final scale (the shared
 * 2010 start, the axis' foot and the 2010 label all in view, the 2025 end off to the right), pans and orbits right
 * following the tips so the 2025 end comes in, settles by ~f44, then a slow drift (B continues from here). PRE frames of pre-roll
 * through the damped follower, so the camera is already moving on f0.
 */
const PRE = 8;
export const CUT_A_CAM_START: NuclearCam = { tx: 40, ty: 360, tz: -30, d: 2470, yaw: -24, pitch: 20, f: 3000, cx: 560, cy: 610 };
export const CUT_A_GLIDES: NuclearGlide[] = [
  { f0: -8, f1: 40, to: { tx: 300, ty: 350, yaw: -14, cx: 530 } },
  { f0: -8, f1: 44, to: { d: 2490 } },
  { f0: 40, f1: 120, to: { tx: 306, d: 2550 } },
];
const TRACK = nuclearTrack(
  CUT_A_CAM_START,
  CUT_A_GLIDES.map((g) => ({ ...g, f0: g.f0 + PRE, f1: g.f1 + PRE })),
  // computed well past A's end (the follower is causal: A's frames are unchanged), so cut B can continue A's drift
  CUT_A_DURATION + PRE + 120,
);
/**
 * rev 3 (the user: "a bit too top heavy, more padding, move everything down"): the same motion and timing, framed smaller and
 * lower. Every camera of the track is pulled back by 1 / s (d / s: the picture shrinks by ~s about the frame point cx, cy)
 * and that frame point is moved by (dx, dy). The labels and the two objects grow by 1 / s in the world (cutAChartAt), so they
 * keep their rev-2 size in px.
 */
export const CUT_A_REFRAME = { s: 0.72, dx: 0, dy: 108 } as const;
export const cutACamAt = (f: number): NuclearCam => {
  const c = nuclearCamAt(TRACK, f + PRE);
  const R = CUT_A_REFRAME;
  return { ...c, d: c.d / R.s, cx: c.cx + R.dx, cy: c.cy + R.dy };
};
/** rev 3: the world size of the labels and objects, 1 / s of their defaults, so they hold their px size in the smaller chart */
export const CUT_A_SIZES = {
  cap: YEAR_LABEL.CAP / CUT_A_REFRAME.s,
  yearGap: YEAR_LABEL.GAP / CUT_A_REFRAME.s,
  costCap: COST_AXIS.CAP / CUT_A_REFRAME.s,
  markScale: 1 / CUT_A_REFRAME.s,
} as const;
export const CUT_A_END_CAM: NuclearCam = cutACamAt(CUT_A_DURATION - 1);

/** the chart's state at cut A's frame f (spread into <CostChart S={S} {...cutAChartAt(f)} />) */
export const cutAChartAt = (f: number): Omit<CostChartProps, "S"> => {
  const y = cutAYearAt(f);
  return {
    solar: { from: 2010, to: y },
    battery: { from: 2010, to: y },
    baseline: { from: 2010, to: 2025 },
    years: cutAYearsAt(f),
    axis: cutAAxisAt(f),
    cap: CUT_A_SIZES.cap,
    yearGap: CUT_A_SIZES.yearGap,
    markScale: CUT_A_SIZES.markScale,
  };
};
/** cut A's last frame (f60): where cut B opens */
export const CUT_A_END = cutAChartAt(CUT_A_DURATION - 1);
export const CUT_A_END_S = CUT_A_S0 + CUT_A_DURATION - 1;
