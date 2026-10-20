// ---------------------------------------------------------------------------
// machinesAndOutputPlan: the geometry, timeline and camera of kyle-london cut 42 V2
// (MachinesAndOutput, "people working"), kept free of React so a script can check
// the framing. The chart world is V1's (option A): England's output line is the
// GROUND the people stand on. MACHINE UNITS are orbitWorld's (the shaft at SUN =
// (540, 960), the pedestal foot at PEDESTAL_FOOT_Y); the engine is drawn in them and
// scaled by ENGINE_S about the 1781 point, so the crew stand large beside it.
// ---------------------------------------------------------------------------
import { PEDESTAL_FOOT_Y, machinePhaseAt, SUN, type Cam, type P2 } from "./orbitWorld";
import { ENGLAND_GDP_DECADE_MEANS, ENGLAND_GDP_PER_HEAD, GDP_FIRST_YEAR, GDP_LAST_YEAR } from "./englandGdpData";
import { makeCamera, smoothstep, swayCam } from "../kits/maps/incaShared";

export const MACHINE_YEAR = 1781; // Watt's sun-and-planet (rotative engine) patent
export const ORBIT_YEAR = 1687; // Newton's Principia

// ---------------------------------------------------------------------------
// THE CHART: linear from 0 (an unlabelled shape). x by year, y by value.
// The plotted series is the DECADE MEANS of the BoE annual series (the annual
// values carry harvest noise): one point per decade, the mean of 1650-59 ...
// 1890-99 at mid-decade (1654.5 ... 1894.5), plus the 1900 annual value as the
// end point; straight segments, no smoothing. One extra point at exactly 1781
// lies ON the straight segment between the 1770s and 1780s means (interpolated,
// so it adds no value and no bend): the machine's engine bed sits on it.
// ---------------------------------------------------------------------------
export const SX = 17.7; // world px per year
export const SY = 1.2417; // world px per GBP of GDP per head
const DEC = ENGLAND_GDP_DECADE_MEANS;
const lerpYear = (pts: readonly (readonly [number, number])[], yr: number) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [y0, v0] = pts[i];
    const [y1, v1] = pts[i + 1];
    if (yr >= y0 && yr <= y1) return v0 + ((v1 - v0) * (yr - y0)) / (y1 - y0);
  }
  return yr < pts[0][0] ? pts[0][1] : pts[pts.length - 1][1];
};
const DEC_PLUS_END: [number, number][] = [...DEC.map((d) => [d[0], d[1]] as [number, number]), [GDP_LAST_YEAR, ENGLAND_GDP_PER_HEAD[GDP_LAST_YEAR - GDP_FIRST_YEAR]]];
/** the 1781 point's value: on the segment between the 1770s and 1780s means */
export const V_MACHINE = lerpYear(DEC_PLUS_END, MACHINE_YEAR);
/** the plotted points [year, value], in year order */
export const SERIES: readonly (readonly [number, number])[] = [...DEC_PLUS_END, [MACHINE_YEAR, V_MACHINE] as [number, number]].sort((p, q) => p[0] - q[0]);
export const LINE_START_YEAR = SERIES[0][0]; // 1654.5 (the 1650s mean)
export const LINE_END_YEAR = SERIES[SERIES.length - 1][0]; // 1900

// THE ENGINE BED (machine units; the engine is scaled about the 1781 point, where machine units and world
// coincide): its underside sits on the line's 1781 point, the pedestal's foot and the column stand on its top.
export const BED_T = 110; // machine units thick
export const BED_TOP = PEDESTAL_FOOT_Y;
export const chartX = (year: number) => SUN[0] + (year - MACHINE_YEAR) * SX;
/** the line's 1781 point sits this far above the bed's underside, so the line's own width tucks under the slab */
export const LINE_TUCK = 42;
export const chartY = (v: number) => BED_TOP + BED_T - LINE_TUCK - (v - V_MACHINE) * SY;
/** the line at a (fractional) year, on the straight segments between the plotted points */
export const pointAtYear = (yr: number): P2 => {
  const y = Math.max(LINE_START_YEAR, Math.min(LINE_END_YEAR, yr));
  return [chartX(y), chartY(lerpYear(SERIES, y))];
};
/** the line from year a to year b: the plotted points strictly between, both ends interpolated */
export const polyline = (a: number, b: number): P2[] => {
  const lo = Math.max(a, LINE_START_YEAR);
  const hi = Math.min(b, LINE_END_YEAR);
  if (hi <= lo) return [];
  const pts: P2[] = [pointAtYear(lo)];
  for (const [y] of SERIES) if (y > lo + 1e-9 && y < hi - 1e-9) pts.push(pointAtYear(y));
  pts.push(pointAtYear(hi));
  return pts;
};

// ---------------------------------------------------------------------------
// THE TIMELINE (frames of this cut, 29.97 fps). Word beats: making 54 · discoveries 104 ·
// universe 165 · inventing 192 · machines 217 · productivity 257 · ultimately 286 · output 313.
// ---------------------------------------------------------------------------
/** the orange line: out of the engine's 1781 point (under the bed) at ORANGE_RUN[0]; it comes out of the
 *  bed's right end on "machines" (~f217) and reaches 1900 at ORANGE_RUN[1] */
export const ORANGE_RUN: readonly [number, number] = [199, 309];
const ACCEL = 10;
const DECEL = 8;
const orangeProfile = (() => {
  const [a, b] = ORANGE_RUN;
  const n = b - a;
  const sp: number[] = [];
  for (let i = 0; i <= n; i++) sp.push(smoothstep(i / ACCEL) * smoothstep((n - i) / DECEL));
  const cum = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + (sp[i - 1] + sp[i]) / 2);
  const tot = cum[n];
  return (g: number) => {
    if (g <= a) return 0;
    if (g >= b) return 1;
    const i = Math.floor(g - a);
    const u = g - a - i;
    return (cum[i] + (cum[Math.min(n, i + 1)] - cum[i]) * u) / tot;
  };
})();
export const orangeTipYear = (g: number) => MACHINE_YEAR + (LINE_END_YEAR - MACHINE_YEAR) * orangeProfile(g);

/** label entrances (frame the slide-up starts; it lands ~14 frames later) */
export const LABEL_F0 = { y1687: 116, y1781: 196, y1650: 308, y1900: 296 };
/** the 1687 label leaves (slides down as it fades) before the travel carries it to the frame edge, and comes back
 *  (slides up) once the final pull-back has it fully in frame */
export const LABEL_1687_OUT = 150;
export const LABEL_1687_BACK = 286;

// ---------------------------------------------------------------------------
// THE ASTRONOMER'S FLOOR at 1687: a short slab (the engine bed's material) whose underside sits on the line's
// 1687 point at its RIGHT end; the line runs up to it from below-left and climbs on from that corner, so it
// does not cut behind the astronomer and his table.
// ---------------------------------------------------------------------------
export const P1687 = pointAtYear(ORBIT_YEAR);
export const SLAB_T = 70;
export const SLAB_TUCK = 22;
export const SLAB_TOP = P1687[1] + SLAB_TUCK - SLAB_T;
export const SLAB_X0 = P1687[0] - 470;
export const SLAB_X1 = P1687[0] + 14;

// ---------------------------------------------------------------------------
// THE ENGINE (machine units, scaled by ENGINE_S about the 1781 point). The beam pivots in its middle on a
// tall column; its near end carries the connecting rod (orbitWorld's rod top rides x = 540), its far end the
// piston rod in the cylinder. The engine is still until the crew start it: the stoker's coal makes the fire
// flare, the lever-man opens the steam (ENGINE_START), the flywheel and beam run up to speed.
// ---------------------------------------------------------------------------
export const A1781 = pointAtYear(MACHINE_YEAR);
export const ENGINE_S = 0.6;
/** a machine-unit point -> world */
export const engineToWorld = (m: P2): P2 => [A1781[0] + ENGINE_S * (m[0] - A1781[0]), A1781[1] + ENGINE_S * (m[1] - A1781[1])];
/** the camera that draws machine units under the world camera */
export const engineCam = (cam: Cam): Cam => ({ k: cam.k * ENGINE_S, cx: A1781[0] + (cam.cx - A1781[0]) / ENGINE_S, cy: A1781[1] + (cam.cy - A1781[1]) / ENGINE_S });
export const BEAM_L = 560; // machine units, pivot -> each end pin
export const BEAM_PIVOT: P2 = [SUN[0] - BEAM_L, -540];
export const CYL_X = SUN[0] - 2 * BEAM_L;
export const CYL_HW = 170;
export const CYL_TOP = 260;
export const COLUMN_W = 150;
/** the world y the crew stand on (the bed top: BED_TOP is machine units) */
export const CREW_FEET_Y = engineToWorld([0, BED_TOP])[1];
/** the bed in WORLD x (it carries the coal heap, the stoker and the boiler on the left, the engineer on the right) */
export const BED_WX0 = -850;
export const BED_WX1 = 975;
/** world props of the engine house */
export const BOILER = { x0: -515, x1: -250, setTop: CREW_FEET_Y - 240, drumTop: CREW_FEET_Y - 420, door: { x0: -488, x1: -396, y0: CREW_FEET_Y - 150, y1: CREW_FEET_Y - 66 } };
export const COAL_HEAP = { cx: -770, hw: 70, h: 64 };
/** crew feet (world) and facing */
export const STOKER = { x: -600, dir: 1 as const };
export const LEVERMAN = { x: 175, dir: -1 as const }; // in front of the column, facing the cylinder
export const ENGINEER = { x: 700, dir: -1 as const }; // in front of the flywheel pedestal's right leg
export const CREW_PX = 330; // a man soles -> skull, world px

/** the shovel: one cycle per SHOVEL_PERIOD frames; the throw (coal leaves the blade) at phase SHOVEL_THROW */
export const SHOVEL_PERIOD = 42;
export const SHOVEL_PHASE0 = 0.15;
export const SHOVEL_THROW = 0.62;
export const shovelPhase = (g: number) => (((g / SHOVEL_PERIOD + SHOVEL_PHASE0) % 1) + 1) % 1;
/** the fire: banked low, then each throw feeds it; it is roaring from FIRE_UP */
export const FIRE_UP: readonly [number, number] = [176, 200];
/** the lever: pulled from high to low over LEVER_PULL (it opens the steam), then held */
export const LEVER_PULL: readonly [number, number] = [198, 210];
/** the engine starts on ENGINE_START (one frame after the lever bottoms out) and runs up over ENGINE_RAMP frames */
export const ENGINE_START = 211;
export const ENGINE_RAMP = 26;
const W_REST = 200; // a settled orbitWorld frame (the machine is still before ENGINE_START)
/** the orbitWorld frame the engine shows at frame g (time-warped: still, then running up to orbitWorld's speed) */
export const engineFrameAt = (g: number) => {
  if (g <= ENGINE_START) return W_REST;
  // integral of smoothstep((t - START) / RAMP) dt
  const u = (g - ENGINE_START) / ENGINE_RAMP;
  if (u <= 1) return W_REST + ENGINE_RAMP * (u * u * u - 0.5 * u * u * u * u);
  return W_REST + ENGINE_RAMP * 0.5 + (g - ENGINE_START - ENGINE_RAMP);
};
export const rodPinAt = (g: number): P2 => machinePhaseAt(engineFrameAt(g)).rodTop;
export const pistonPinAt = (g: number): P2 => {
  const e = rodPinAt(g);
  return [2 * BEAM_PIVOT[0] - e[0], 2 * BEAM_PIVOT[1] - e[1]];
};

// ---------------------------------------------------------------------------
// THE CAMERA (world): close on the astronomer at 1687 -> one log-space pull-back that shows him standing on a
// long line from the left (f0-150) -> a travel right and up along the line to the engine crew at 1781 (f165-205),
// settled on the crew while they start the engine -> a pull-back up and right with the orange climb to the
// whole line (option A's end framing by f312) -> a creep in. The house sway on top.
// ---------------------------------------------------------------------------
export const P_START = pointAtYear(LINE_START_YEAR);
export const ASTRO_X = P1687[0] - 330; // about where the astronomer stands (he faces right, to the telescope)
const myCam = makeCamera([
  { f: 0, k: 2.0, wx: ASTRO_X + 120, wy: SLAB_TOP, sx: 520, sy: 930 },
  { f: 60, k: 1.45, wx: ASTRO_X + 120, wy: SLAB_TOP, sx: 590, sy: 880 },
  { f: 140, k: 0.84, wx: ASTRO_X + 120, wy: SLAB_TOP, sx: 680, sy: 600 },
  { f: 205, k: 0.6, wx: 40, wy: CREW_FEET_Y, sx: 520, sy: 990 },
  { f: 220, k: 0.585, wx: 40, wy: CREW_FEET_Y, sx: 505, sy: 990 },
  { f: 252, k: 0.38, wx: A1781[0], wy: CREW_FEET_Y, sx: 580, sy: 850 },
  { f: 274, k: 0.275, wx: ASTRO_X, wy: SLAB_TOP, sx: 20, sy: 1010 },
  { f: 312, k: 0.202, wx: P_START[0], wy: P_START[1], sx: 125, sy: 1040 },
  { f: 360, k: 0.206, wx: P_START[0], wy: P_START[1], sx: 122, sy: 1040 },
]);
export const camBaseG = (g: number): Cam => myCam(g);
export const camAtG = (g: number): Cam => swayCam(camBaseG(g), g);
