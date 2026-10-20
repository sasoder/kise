// ---------------------------------------------------------------------------
// machinesAndOutputEnginePlan (V1 copy of machinesAndOutputPlan, for MachinesAndOutputEngine): the geometry, timeline and camera of kyle-london cut 42
// (MachinesAndOutput), kept free of React so a script can check the framing.
// World px are orbitWorld's: the machine's shaft (the sun gear's axle) sits at
// SUN = (540, 960) and its bearing pedestal's flat foot at y = PEDESTAL_FOOT_Y;
// the chart is laid out so that England's 1781 point sits exactly under the
// centre of the engine bed the foot stands on (the machine STANDS on the line at 1781).
// ---------------------------------------------------------------------------
import { PEDESTAL_FOOT_Y, camBaseAt, machinePhaseAt, SUN, type Cam, type P2 } from "./orbitWorld";
import { ENGLAND_GDP_DECADE_MEANS, ENGLAND_GDP_PER_HEAD, GDP_FIRST_YEAR, GDP_LAST_YEAR } from "./englandGdpData";
import { makeCamera, smootherstep, smoothstep, swayCam } from "../kits/maps/incaShared";

export const WORLD_OFFSET = 203; // cut 42's g = 0 is cut 10's f203
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

// THE ENGINE BED: one flat dark-umber slab under the whole engine; its underside sits on
// the line's 1781 point, the pedestal's foot (PEDESTAL_FOOT_Y) and the beam's column stand on its top.
export const BED_T = 110; // world px thick
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
// THE TIMELINE (frames of this cut, 29.97 fps)
// ---------------------------------------------------------------------------
/** the cream line's last stretch: its end runs in from off frame (left) into the engine bed */
export const CREAM_FROM = 1700; // already drawn up to here (off frame left until its end runs in)
export const CREAM_RUN: readonly [number, number] = [54, 88];
/** the orange line: out of the engine at ORANGE_RUN[0], to 1900 at ORANGE_RUN[1] */
export const ORANGE_RUN: readonly [number, number] = [196, 309];
const ACCEL = 10; // frames to reach full speed out of the engine
const DECEL = 8; // frames to settle on 1900
/** the cream line's drawn end (fractional year) */
export const creamEndYear = (g: number) => {
  const u = Math.max(0, Math.min(1, (g - CREAM_RUN[0]) / (CREAM_RUN[1] - CREAM_RUN[0])));
  // eased only at the end: it slows into the bed
  const e = u < 0.7 ? u / 0.7 * 0.8 : 0.8 + 0.2 * (1 - Math.pow(1 - (u - 0.7) / 0.3, 2));
  return CREAM_FROM + (MACHINE_YEAR - CREAM_FROM) * e;
};
/** the orange tip's year: accelerates out of the engine, constant speed, settles on 1900 */
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
export const LABEL_F0 = { y1781: 84, y1687: 132, y1650: 146, y1900: 296 };

// ---------------------------------------------------------------------------
// THE ORBIT GLYPH at 1687: cut 10's Sun-and-ellipse, small, its Sun on the line
// ---------------------------------------------------------------------------
export const GLYPH_A = 400; // ~160 px wide at the end framing
export const GLYPH_E = 0.55; // more eccentric than cut 10's 0.35 so it reads as an ellipse when small
export const GLYPH_W = (40 * Math.PI) / 180; // perihelion down-right: the wide side of the orbit sits up-left, over empty page
export const GLYPH_PERIOD = 120; // frames per orbit
export const GLYPH_SUN: P2 = pointAtYear(ORBIT_YEAR);
/** the planet on the glyph's ellipse at frame g (Kepler's equation, equal areas in equal times) */
export const glyphPlanetAt = (g: number): P2 => {
  const M = (2 * Math.PI * (g + 30)) / GLYPH_PERIOD;
  let E = M;
  for (let i = 0; i < 8; i++) E -= (E - GLYPH_E * Math.sin(E) - M) / (1 - GLYPH_E * Math.cos(E));
  const th = 2 * Math.atan2(Math.sqrt(1 + GLYPH_E) * Math.sin(E / 2), Math.sqrt(1 - GLYPH_E) * Math.cos(E / 2));
  const r = (GLYPH_A * (1 - GLYPH_E * GLYPH_E)) / (1 + GLYPH_E * Math.cos(th));
  return [GLYPH_SUN[0] + r * Math.cos(th + GLYPH_W), GLYPH_SUN[1] + r * Math.sin(th + GLYPH_W)];
};

// ---------------------------------------------------------------------------
// THE BEAM ENGINE above the bed (Watt's rotative beam-engine silhouette): the
// rocking beam pivots in its MIDDLE on a tall cast column standing on the bed;
// its right end carries the connecting rod's top (orbitWorld: it rides the
// vertical x = 540), its left end the piston rod, which slides in and out of
// the CYLINDER standing on the bed under it. The two ends move opposite ways:
// when the flywheel end is up, the cylinder end is down.
// ---------------------------------------------------------------------------
export const BEAM_L = 560; // pivot -> each end pin
export const BEAM_PIVOT: P2 = [SUN[0] - BEAM_L, -540];
export const CYL_X = SUN[0] - 2 * BEAM_L; // the cylinder's (and piston rod's) axis
export const CYL_HW = 170; // the cylinder's half width
export const CYL_TOP = 260; // the top of the cylinder's body (under its cover)
export const COLUMN_W = 150; // the column's width scale (capital ~1.05x, plinth ~1.25x)
/** the bed's extent: from just left of the cylinder to just right of the pedestal's foot (+-460) */
export const BED_X0 = CYL_X - CYL_HW - 70;
export const BED_X1 = SUN[0] + 460 + 50;
export const rodPinAt = (g: number): P2 => machinePhaseAt(WORLD_OFFSET + g).rodTop;
/** the piston rod's top pin: the beam's other end, mirrored through the pivot */
export const pistonPinAt = (g: number): P2 => {
  const e = rodPinAt(g);
  return [2 * BEAM_PIVOT[0] - e[0], 2 * BEAM_PIVOT[1] - e[1]];
};

// ---------------------------------------------------------------------------
// THE CAMERA. g = 0 is cut 10's f203 exactly (cut 10's unswayed camera, its creep
// carried for the first frames by a blend whose weight starts flat), then ONE
// log-space pull-back drifting left that reveals the past (1650s -> 1781) by f165,
// a slight push in toward the machine while the orange line leaves it (the 1650 and
// 1687 labels stay in frame), a second pull-back with the climb so the tip stays in
// frame and the whole line is in view by ~f312, then a creep in.
// The house sway continues from cut 10 (swayCam at world frame 203 + g).
// ---------------------------------------------------------------------------
const base0 = camBaseAt(WORLD_OFFSET);
export const P_START = pointAtYear(LINE_START_YEAR); // the line's left end (the 1650s)
const P1650 = P_START;
export const A1781 = pointAtYear(MACHINE_YEAR); // under the engine bed's centre
const myCam = makeCamera([
  { f: 0, k: base0.k, wx: base0.cx, wy: base0.cy, sx: 540, sy: 960 },
  { f: 30, k: 0.78, wx: SUN[0], wy: SUN[1], sx: 570, sy: 690 },
  { f: 66, k: 0.45, wx: A1781[0], wy: A1781[1], sx: 610, sy: 700 },
  { f: 110, k: 0.31, wx: A1781[0], wy: A1781[1], sx: 790, sy: 585 },
  { f: 165, k: 0.23, wx: P1650[0], wy: P1650[1], sx: 150, sy: 1028 },
  { f: 215, k: 0.248, wx: P1650[0], wy: P1650[1], sx: 128, sy: 1032 },
  { f: 250, k: 0.236, wx: P1650[0], wy: P1650[1], sx: 128, sy: 1034 },
  { f: 290, k: 0.212, wx: P1650[0], wy: P1650[1], sx: 126, sy: 1036 },
  { f: 312, k: 0.202, wx: P1650[0], wy: P1650[1], sx: 125, sy: 1040 },
  { f: 360, k: 0.206, wx: P1650[0], wy: P1650[1], sx: 122, sy: 1040 },
]);
const BLEND = 44;
export const camBaseG = (g: number): Cam => {
  const a = camBaseAt(WORLD_OFFSET + g);
  const b = myCam(g);
  const w = smootherstep(Math.max(0, Math.min(1, g / BLEND)));
  if (w <= 0) return a;
  return {
    k: Math.exp(Math.log(a.k) * (1 - w) + Math.log(b.k) * w),
    cx: a.cx * (1 - w) + b.cx * w,
    cy: a.cy * (1 - w) + b.cy * w,
  };
};
export const camAtG = (g: number): Cam => swayCam(camBaseG(g), WORLD_OFFSET + g);
