// ---------------------------------------------------------------------------
// returnsHugePlan — the pure plan of cut 6, ReturnsHugeDownsideSmall (scott-aircraft-order): geometry in the
// cut's world px (= the payoff frame's screen px at k 1, look (540, 960)), the beat frames, the two columns'
// height curves and the camera glides. No React, so the planner in the builder's scratch can import it.
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** The ground line: the apron slab's cut front edge = break-even (the NEAR edge of the apron). The two columns
 *  stand on it / hang from it in the foreground; the jet stands far back on the apron behind them. Raised so the
 *  190 px dip ends above the first caption band (y 1080) at rest. */
export const GROUND = 884;
/** Rung pitch on both fills: one scale for the up and the down, so the asymmetry can be counted. */
export const RUNG = 64;
/** The up column (the returns): glass, an amber fill with headroom under the glass top. */
export const UP = { x: 380, w: 120, H: 816, headroom: 24 } as const;
/** The down column (the downside): the same glass column as the up one, same width, rungs and rounded end, hanging
 *  into the earth right of centre, its fill a drained deep umber; `gap` = the glass below the fill's leading edge
 *  (the mirror of the up column's headroom). The up column is 4.3x longer. */
export const DOWN = { x: 700, w: 120, D: 190, gap: 12 } as const;
/** United's jet (the bet), nose left, far back on the apron behind and between the columns (ZJ): its centre at the
 *  payoff and its length on screen (px). */
export const JET = { cx: 595, len: 290 } as const;

/** Beats (frames at 24000/1001; the brief's word table, S6). */
export const BEAT = {
  if: 3,
  works: 7,
  returns: 15,
  huge: 27,
  hugeEnd: 39,
  and: 47,
  downsides: 51,
  smaller: 69,
} as const;

/** The up column: out of its slot from f4 (just after "if"), climbing through "returns" and "huge", landing
 *  on f38 (before "huge" ends, f39). Ease in, a long fast middle, ease out. */
export const RISE = { f0: 4, f1: 38 } as const;
/** its slot parts from a closed seam to the column's mouth just before the column comes out of it */
export const SLOT_UP = { f0: 0, f1: 5 } as const;
export const upH = (f: number) => {
  const u = clamp01((f - RISE.f0) / (RISE.f1 - RISE.f0));
  const quad = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
  return UP.H * (0.5 * ss(u) + 0.5 * quad);
};
/** The down column: its slot starts opening under "you know" (f44-50), the column sinks out of it from f50
 *  ("downsides" f51) and settles by f64, a few frames before "smaller" (f69). */
export const SLOT_OPEN = { f0: 44, f1: 50 } as const;
export const SINK = { f0: 50, f1: 64 } as const;
export const downH = (f: number) => DOWN.D * ss(Math.pow(clamp01((f - SINK.f0) / (SINK.f1 - SINK.f0)), 0.8));

/** The identifiers: a cream "+" on an ink disc riding the up column's amber cap (enters f20-32), a cream "−" on an
 *  ink disc riding the down column's foot (enters f55-67, once the foot is deep enough to hold it); house text
 *  entrance; `inset` = world px from the fill's top / leading edge, `px` / `disc` screen px. */
export const SIGNS = { on: true, px: 64, inset: 44, plus: 20, minus: 55, disc: 74 } as const;

/** The camera (makeClockCam LOOK + k, glides on the cut's clock). Opens on the jet and the left slot; ONE blended
 *  move: the tilt-up with the rising top (f2-38) and the pull-back to the payoff (look (540, 960), k 1; f12-50)
 *  overlap, so it climbs with the column, turns over smoothly near "huge" and comes down and out, settled by ~f52
 *  (peak |d2| 2.2 px/f^2, peak speed 22 px/f); then the slow living creep. */
export const CAM_START = { x: 500, y: 812, k: 1.17 } as const;
export const CAM_GLIDES = [
  { f0: -24, f1: 4, k: 1.2 },
  { f0: 2, f1: 38, dx: -60, dy: -540, k: 1.22 },
  { f0: 12, f1: 50, dx: 100, dy: 688, k: 1.0 },
  { f0: 56, f1: 130, k: 1.045 },
] as const;

// ---------------------------------------------------------------------------
// THE CHART PLANE IN THE WORLD (aircraftShared's pinhole, side mode, yaw 0, pitch 0)
// The columns and the earth section live on the plane Z = ZC (the apron slab's cut front edge), drawn as a 2D
// overlay in the cut's px. With yaw and pitch 0 a plane of constant Z projects flat, so the 2D look (lx, ly, k)
// maps exactly onto a side AirCam: camera x = the look's x on that plane, eye height EYE, focal F0 * k, and the
// lens shift (horizon row) that puts world px row ly on the frame's middle. The jet stands ZJ - ZC m behind the edge.
// ---------------------------------------------------------------------------
/** focal px at k 1 */
export const F0 = 2310;
/** the chart plane's depth (m from the camera) */
export const ZC = 330;
/** the jet's depth (m) */
export const ZJ = 544;
/** eye height (m): the apron strip between the horizon and the cut edge is S0 * EYE px tall at k 1 */
export const EYE = 18;
/** screen px per metre on the chart plane at k 1 */
export const S0 = F0 / ZC;
/** chart px (u, v) -> world [X, Y, Z] on the chart plane */
export const chartToWorld = (u: number, v: number): [number, number, number] => [(u - 540) / S0, (GROUND - v) / S0, ZC];
/** the 2D look (camera centre in chart px + zoom) -> the stage's side camera */
export const airCamOf = (c: { x: number; y: number; k: number }) => ({
  mode: "side" as const,
  x: (c.x - 540) / S0,
  y: EYE,
  z: 0,
  f: F0 * c.k,
  horizon: 960 + c.k * (GROUND - c.y - S0 * EYE),
});
/** the jet's [X, Z] on the ground so its centre lands on JET.cx at the payoff */
export const JET_AT: [number, number] = [((JET.cx - 540) * ZJ) / F0, ZJ];
