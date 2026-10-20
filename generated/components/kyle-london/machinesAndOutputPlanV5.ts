// ---------------------------------------------------------------------------
// machinesAndOutputPlanV5: the geometry, timeline, camera and DEPTH of kyle-london cut 42 V5 (the depth pass:
// copied from machinesAndOutputPlanV4.ts; V4's 2D camera is kept as the front plane of a perspective camera, see
// THE DEPTH CAMERA at the end; the bed is trimmed where the rising ground meets it), kept free of React so a script can check
// the framing. The chart world is V1's (option A): England's output line is the
// GROUND the people stand on. MACHINE UNITS are orbitWorld's (the shaft at SUN =
// (540, 960), the pedestal foot at PEDESTAL_FOOT_Y); the engine is drawn in them and
// scaled by ENGINE_S about the 1781 point, so the crew stand large beside it.
// ---------------------------------------------------------------------------
import { PEDESTAL_FOOT_Y, machinePhaseAt, SUN, type Cam, type P2 } from "./orbitWorld";
import { ENGLAND_GDP_DECADE_MEANS, ENGLAND_GDP_PER_HEAD, GDP_FIRST_YEAR, GDP_LAST_YEAR } from "./englandGdpData";
import { smoothstep, swayCam } from "../kits/maps/incaShared";

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
export const ORANGE_RUN: readonly [number, number] = [199, 313]; // reaches 1900 on "output"
const ACCEL = 10;
const DECEL = 14; // eases into 1900, no overshoot
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
export const LABEL_F0 = { y1687: 116, y1781: 196, y1900: 300 }; // 1900 lands with the tip on f313
/** the 1687 label leaves (slides down as it fades) before the travel carries it to the frame edge, and comes back
 *  (slides up) once the final pull-back has it fully in frame */
export const LABEL_1687_OUT = 163; // fully gone (f190) before the travel takes it to the frame edge
export const LABEL_1687_BACK = 288; // back once the slower V4 pull-back has carried it above the caption band (it returns on a short slide)

// ---------------------------------------------------------------------------
// THE ASTRONOMER'S FLOOR at 1687: a short slab (the engine bed's material) whose underside sits on the line's
// 1687 point at its RIGHT end; the line runs up to it from below-left and climbs on from that corner, so it
// does not cut behind the astronomer and his table.
// ---------------------------------------------------------------------------
export const P1687 = pointAtYear(ORBIT_YEAR);
export const SLAB_T = 70;
export const SLAB_TUCK = 22;
export const SLAB_TOP = P1687[1] + SLAB_TUCK - SLAB_T;
export const SLAB_X0 = P1687[0] - 400;
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
/** V5: the bed ends where the rising ground (the line, extruded back) reaches its top: right of it the ground itself is
 *  the floor (the engineer stands on it). Solved below, after the line. */
export const BED_WX1_V4 = 975;
/** world props of the engine house */
export const BOILER = { x0: -515, x1: -250, setTop: CREW_FEET_Y - 240, drumTop: CREW_FEET_Y - 420, door: { x0: -488, x1: -396, y0: CREW_FEET_Y - 150, y1: CREW_FEET_Y - 66 } };
export const COAL_HEAP = { cx: -770, hw: 70, h: 64 };
/** crew feet (world) and facing */
export const STOKER = { x: -600, dir: 1 as const };
export const LEVERMAN = { x: 175, dir: -1 as const }; // in front of the column, facing the cylinder
export const ENGINEER = { x: 700, dir: -1 as const }; // in front of the flywheel pedestal's right leg
/** the line's world y at world x (on the plotted straight segments) = the ground's height there */
export const lineYAtX = (x: number) => pointAtYear(MACHINE_YEAR + (x - A1781[0]) / SX)[1];
/** V5: where the rising ground reaches the bed's top (world x) */
export const BED_WX1 = (() => {
  let lo = A1781[0];
  let hi = BED_WX1_V4;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (lineYAtX(m) > CREW_FEET_Y) lo = m;
    else hi = m;
  }
  return lo;
})();
/** V5: the engineer stands on the rising ground right of the bed */
export const ENGINEER_FEET_Y = Math.min(CREW_FEET_Y, lineYAtX(ENGINEER.x));
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
/** on "productivity" the engine picks up speed: x1 -> x1.7 over SPEEDUP frames */
export const SPEEDUP_AT = 257;
const SPEEDUP = 18;
const SPEED_HI = 1.7;
export const engineFrameAt = (g: number) => {
  if (g <= ENGINE_START) return W_REST;
  // integral of smoothstep((t - START) / RAMP) dt
  const u = (g - ENGINE_START) / ENGINE_RAMP;
  let f: number;
  if (u <= 1) f = W_REST + ENGINE_RAMP * (u * u * u - 0.5 * u * u * u * u);
  else f = W_REST + ENGINE_RAMP * 0.5 + (g - ENGINE_START - ENGINE_RAMP);
  // the extra speed: integral of (SPEED_HI - 1) * smoothstep((t - SPEEDUP_AT) / SPEEDUP)
  const v = (g - SPEEDUP_AT) / SPEEDUP;
  if (v > 0) f += (SPEED_HI - 1) * SPEEDUP * (v <= 1 ? v * v * v - 0.5 * v * v * v * v : 0.5 + (v - 1));
  return f;
};
export const rodPinAt = (g: number): P2 => machinePhaseAt(engineFrameAt(g)).rodTop;
export const pistonPinAt = (g: number): P2 => {
  const e = rodPinAt(g);
  return [2 * BEAM_PIVOT[0] - e[0], 2 * BEAM_PIVOT[1] - e[1]];
};

// ---------------------------------------------------------------------------
// THE CAMERA (world), V4: V3's framings, V2's kind of motion. V3 ran pchip through ten keys with two
// hold pairs (f140/158, f200/220), a re-targeting mid-key (the 1687-1781 chord) and a pull-back key that
// overshot right and up (f246) before settling hard at f265: hold-move-hold with velocity spikes of ~58 px/f.
// V4 is ONE continuous move built from four overlapping moves between V3's framings. Each move carries all
// three channels (ln k, cx, cy) on the same velocity profile (a smooth beta lobe, zero speed and zero
// acceleration at its ends), so pan and zoom move together, and each move starts before the last one ends,
// so the camera never stops:
//   M1 close on Newton (already pulling back at f0) -> the 1687 scene (he stands on the long line, "1687"),
//      decelerating into a slow drift while the label reads;
//   M2 the travel right and up along the line to the engine crew at 1781 (one lobe, f142-214);
//   M3 the pull-back up and right with the orange climb to the whole line (early peak, a long deceleration,
//      landing ~f316 just after the tip reaches 1900);
//   M4 the creep in on the settled end (rises under M3's tail, runs past the last frame).
// The house sway on top.
// ---------------------------------------------------------------------------
export const P_START = pointAtYear(LINE_START_YEAR);
export const ASTRO_X = P1687[0] - 330; // about where the astronomer stands (he faces right, to the telescope)
export const SCENE_1687: P2 = [P1687[0] - 200, SLAB_TOP];
type Framing = { k: number; wx: number; wy: number; sx: number; sy: number };
type Chan = [number, number, number]; // ln k, cx, cy
const chan = (q: Framing): Chan => [Math.log(q.k), q.wx - (q.sx - 540) / q.k, q.wy - (q.sy - 960) / q.k];
/** V3's framings */
export const FR_CLOSE: Framing = { k: 2.0, wx: ASTRO_X + 120, wy: SLAB_TOP, sx: 520, sy: 930 };
export const FR_1687: Framing = { k: 0.715, wx: SCENE_1687[0], wy: SCENE_1687[1], sx: 752, sy: 786 };
export const FR_CREW: Framing = { k: 0.6, wx: 40, wy: CREW_FEET_Y, sx: 520, sy: 990 };
export const FR_END: Framing = { k: 0.2215, wx: SLAB_X0, wy: SLAB_TOP + SLAB_T, sx: 70, sy: 1034 };
export const FR_CREEP: Framing = { k: 0.2265, wx: SLAB_X0, wy: SLAB_TOP + SLAB_T, sx: 64, sy: 1034 };
/** a move: from framing a to framing b over frames [f0, f1] on a beta(pa, pb) velocity lobe (peak at
 *  pa / (pa + pb) of the window); a window that starts before f0 = 0 is already moving on the first frame
 *  and is renormalised so the move still ends exactly on b */
/** lag: per-channel window shift in frames [ln k, cx, cy] (0 = pan and zoom exactly in step) */
/** anchor: the move interpolates the FRAMING (ln k, the anchored world point and its screen spot) rather than
 *  (ln k, cx, cy), so a subject anchored at both ends glides on screen instead of swinging out and back */
type Move = { a: Framing; b: Framing; f0: number; f1: number; pa: number; pb: number; lag?: Chan; anchor?: boolean };
export const MOVES: Move[] = [
  { a: FR_CLOSE, b: FR_1687, f0: -20, f1: 172, pa: 1.5, pb: 1.5, anchor: true },
  // the slide right leads and the rise lags, so the 1687 floor leaves by the left edge above the caption band
  { a: FR_1687, b: FR_CREW, f0: 144, f1: 216, pa: 2.4, pb: 2.4, lag: [0, -8, 10] },
  // the pan leads the zoom: the orange tip keeps clear of the right edge as it comes out of the bed, and the
  // 1687 floor comes back in from the left edge above the caption band (the zoom finishes the move)
  { a: FR_CREW, b: FR_END, f0: 204, f1: 318, pa: 2, pb: 3, lag: [10, -12, -10] },
  { a: FR_END, b: FR_CREEP, f0: 290, f1: 430, pa: 2, pb: 2 },
];
const SUB = 8;
/** each move's progress 0..1 from frame 0 on (cumulative trapezoid on a 1/SUB grid) */
const progressOf = (m: { f0: number; f1: number; pa: number; pb: number }) => {
  const w = (f: number) => {
    const u = (f - m.f0) / (m.f1 - m.f0);
    return u <= 0 || u >= 1 ? 0 : Math.pow(u, m.pa) * Math.pow(1 - u, m.pb);
  };
  const n = Math.ceil((m.f1 - Math.max(0, m.f0)) * SUB);
  const lo = Math.max(0, m.f0);
  const cum = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + ((w(lo + (i - 1) / SUB) + w(lo + i / SUB)) / 2) * (1 / SUB));
  const tot = cum[n];
  const v0 = w(lo) / tot; // the speed (progress per frame) on frame 0, carried backwards for f < 0
  return (f: number) => {
    if (f <= lo) return (f - lo) * v0;
    const p = (f - lo) * SUB;
    if (p >= n) return 1;
    const i = Math.floor(p);
    return (cum[i] + (cum[i + 1] - cum[i]) * (p - i)) / tot;
  };
};
const progress = MOVES.map((m) => [0, 1, 2].map((j) => progressOf({ ...m, f0: m.f0 + (m.lag?.[j] ?? 0), f1: m.f1 + (m.lag?.[j] ?? 0) })));
const C0 = chan(MOVES[0].a);
const DELTAS = MOVES.map((m) => {
  const a = chan(m.a);
  const b = chan(m.b);
  return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as Chan;
});
const lerpFraming = (a: Framing, b: Framing, s: number): Framing => ({
  k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * s),
  wx: a.wx + (b.wx - a.wx) * s,
  wy: a.wy + (b.wy - a.wy) * s,
  sx: a.sx + (b.sx - a.sx) * s,
  sy: a.sy + (b.sy - a.sy) * s,
});
export const camBaseG = (g: number): Cam => {
  const c: Chan = [C0[0], C0[1], C0[2]];
  MOVES.forEach((m, i) => {
    if (m.anchor) {
      const a = chan(m.a);
      const q = chan(lerpFraming(m.a, m.b, progress[i][0](g)));
      for (let j = 0; j < 3; j++) c[j] += q[j] - a[j];
    } else for (let j = 0; j < 3; j++) c[j] += DELTAS[i][j] * progress[i][j](g);
  });
  return { k: Math.exp(c[0]), cx: c[1], cy: c[2] };
};
export const camAtG = (g: number): Cam => swayCam(camBaseG(g), g);

// ---------------------------------------------------------------------------
// THE DEPTH CAMERA (V5). World (X, Y, Z): X, Y the chart world above, Z the depth behind the FRONT PLANE (the line's
// plane, Z = 0). The front plane maps exactly as camAtG (V4's approved 2D camera). A dolly camera: focal FOCAL px,
// distance D = FOCAL / k to the front plane; one VP per frame at x = 540 and y = H (the horizon, the eye level):
//   s = D / (D + Z); screen = (540 + k s (X - cx), H + k s (Y - Ye)), Ye = cy + (H - 960) / k.
// H is keyed per framing (eye height above the ground in the close shots, high in the wide) and moves on the camera
// moves' own zoom progress, so the tilt is as smooth as the path.
// ---------------------------------------------------------------------------
export const FOCAL = 1500;
/** the ridge's depth: a finite plateau that holds the slab and the bed (their depth + a margin), closed by a drawn
 *  back edge that follows the data in perspective */
export const Z_FAR = 420;
export type P3 = [number, number, number];
export type View = { k: number; cx: number; cy: number; H: number; D: number; Ye: number };
const camOfFraming = (q: Framing): Cam => ({ k: q.k, cx: q.wx - (q.sx - 540) / q.k, cy: q.wy - (q.sy - 960) / q.k });
/** the horizon of a framing whose eye is at world height eyeY */
const horizonFor = (q: Framing, eyeY: number) => {
  const c = camOfFraming(q);
  return 960 + c.k * (eyeY - c.cy);
};
/** horizon keys: the eye at a standing man's eye height (300) over the slab / (320) over the bed; high in the wide */
export const H_CLOSE = horizonFor(FR_CLOSE, SLAB_TOP - 300);
export const H_1687 = horizonFor(FR_1687, SLAB_TOP - 300);
export const H_CREW = horizonFor(FR_CREW, CREW_FEET_Y - 320);
export const H_END = 60;
const H_OF = new Map<Framing, number>([
  [FR_CLOSE, H_CLOSE],
  [FR_1687, H_1687],
  [FR_CREW, H_CREW],
  [FR_END, H_END],
  [FR_CREEP, H_END],
]);
export const horizonAtG = (g: number) => {
  let h = H_CLOSE;
  MOVES.forEach((m, i) => {
    h += ((H_OF.get(m.b) ?? 0) - (H_OF.get(m.a) ?? 0)) * progress[i][0](g);
  });
  return h;
};
export const viewAtG = (g: number): View => {
  const c = camAtG(g);
  const H = horizonAtG(g);
  return { k: c.k, cx: c.cx, cy: c.cy, H, D: FOCAL / c.k, Ye: c.cy + (H - 960) / c.k };
};
export const depthScale = (v: View, z: number) => v.D / (v.D + z);
/** a world point at depth z -> screen */
export const proj = (v: View, p: P3): P2 => {
  const s = (v.k * v.D) / (v.D + p[2]);
  return [540 + s * (p[0] - v.cx), v.H + s * (p[1] - v.Ye)];
};
/** the 2D camera that draws the plane at depth z (for flat drawings: figures, the sky, the tube) */
export const camAtZ = (v: View, z: number): Cam => {
  const kz = v.k * depthScale(v, z);
  return { k: kz, cx: v.cx, cy: v.Ye + (960 - v.H) / kz };
};
/** the atmosphere: how far a depth z sinks toward the page tone (0 at the front plane) */
export const tintAt = (z: number) => (0.55 * Math.max(0, z)) / (Math.max(0, z) + 900);

// DEPTHS (world): the 1687 group and the 1781 group stand on their platforms, whose fronts are flush with the
// front plane; the engine's working plane sits behind the crew.
export const SLAB_Z1 = 240;
export const Z_NEWTON = 60;
export const TABLE_Z: readonly [number, number] = [20, 120];
export const BED_Z1 = 340;
export const Z_CREW = 70;
export const CYL_R_W = CYL_HW * ENGINE_S; // the steam cylinder's radius, world
export const Z_ENGINE = Z_CREW + CYL_R_W; // the engine's plane: the cylinder's front surface is at the crew's depth
export const BOILER_Z: readonly [number, number] = [Z_CREW, 330];
