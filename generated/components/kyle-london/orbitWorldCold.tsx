// ---------------------------------------------------------------------------
// orbitWorldCold: the cold-review copy of orbitWorld (V2) for HowTheUniverseWorksCold only (cut 42 keeps
// importing orbitWorld). Round 1: the Fellows round the orrery (Wright of Derby), a bigger orrery, a push into
// the orbit, a cleaner morph.
// orbitWorld (V2): THE ORRERY THAT BECOMES AN ENGINE, kyle-london cut 10
// (HowTheUniverseWorks). Cut 42 (MachinesAndOutput) reads the settled machine
// (SunAndPlanetMachine, machinePhaseAt, the camera, PEDESTAL_FOOT_Y): from f178
// on the machine, its kinematics and the camera are exactly V1's, so those
// exports behave as before. Dwarkesh map style, the umber page (TexcocoPage).
// Notes: <working>/animation_source/notes/ORBIT_WORLD.md, SHARED_CHANGES.md.
//
// WORLD UNITS. World px; the Sun (later the sun gear on the flywheel shaft) at
// SUN = (540, 960). Screen angles from +x towards +y (clockwise on screen).
//
// THE ORRERY (an engraved 18th-century brass orrery, after the instrument in
// Wright of Derby's "A Philosopher Lecturing on the Orrery", 1766), seen from a
// little above: the orbit plane is horizontal, so a circle of radius R draws as
// SUN + (R cos a, ORRERY_TILT0 R sin a). A turned baluster pedestal on a flat
// foot carries the drum (the gear box); a pillar rises from the drum to the Sun
// ball (rays + hatching); one long orange arm from a collar on the pillar
// carries the orange Earth on a short stalk (with its little cream Moon). The
// orrery turns at ORRERY_OMEGA (one year per 102 frames); the Earth traces its
// orbit as a thin orange path f48-150 (exactly one turn).
//
// THE CHANGE (f150-178, one continuous change, nothing floats apart): the orbit
// plane tilts up to face us (tilt 0.3 -> 1) while the Earth's arm shortens
// (400 -> 176) and rises into the Sun's plane; the Earth ball grows teeth into
// the planet gear, the Sun ball's rays harden into the sun gear's teeth; the
// traced orbit tilts up and thickens into the flywheel rim; the baluster parts
// into the A-frame's two legs while the drum rises to the shaft and becomes the
// bearing block (StandMorph m 0 -> 1); the flywheel's hub ring and arms grow
// out; the rod comes down from off frame and couples on f178.
//
// THE MACHINE (Watt's sun-and-planet gear, William Murdoch's design, patented
// by Watt in 1781; illustrative). Equal gears: N 18, pitch radius 88 (tips 98,
// roots 76), centres 176 apart. The planet gear is fixed to the connecting rod
// (it rocks with the rod), the rod's top rides the vertical through SUN,
// ROD_LEN 1500. phi_sun = 2 theta - phi_planet + pi - pi/N: the sun gear and
// the flywheel turn twice per orbit; one orbit per 140 frames (OMEGA_END).
//
// API (V1 names kept; V1-only constants kept as legacy values)
//   palette: INK LAND ACCENT ACCENT_DEEP DARK (#17120D) RIM_INK SPOKE_INK
//   geometry: SUN N_TEETH PITCH_R TIP_R ROOT_R CENTRE_D RIM_R ROD_LEN OMEGA_END
//     HUB_RING_R PEDESTAL_FOOT_Y T; new: ORRERY_TILT0 EARTH_R0 ORRERY_OMEGA
//     legacy (V1 quill/Kepler, unused by V2): ORBIT_A ORBIT_E ORBIT_W THETA0 P0
//   machinePhaseAt(frame) -> { theta, planet, chi, phiP, phiS, rodTop } (any frame;
//     closed form after f203; theta + ORBIT_W is the planet's screen angle)
//   worldStateAt(frame); <OrbitScene frame cam idPrefix? pedestal? footY? />;
//   <SunAndPlanetMachine frame cam ... /> (frames >= T.settled);
//   <Pedestal dy? footY? morph? /> (morph 0 = the orrery's baluster + drum, 1 = the A-frame stand)
//   camBaseAt cutCamAt MACHINE_END_CAM MACHINE_END_CAM_VEL (unchanged from V1)
// ---------------------------------------------------------------------------
import React from "react";
import { CREAM, Fellow, GENT_STRIDE, POSES, WALK, castAnchors, headTurn, lerpFig, mixInk, shadeInk, type FigPose, type Ink } from "./londonCast";
import {
  ACCENT,
  ACCENT_DEEP,
  INK,
  LAND,
  WorldSvg,
  clamp01,
  makeCamera,
  mixColor,
  smootherstep,
  smoothstep,
  swayCam,
  type Cam,
  type P2,
} from "../kits/maps/incaShared";

export { ACCENT, ACCENT_DEEP, INK, LAND };
export type { Cam, P2 };
export const DARK = "#17120D";
/** the flywheel's cream: context level, so the orange gears carry the eye */
export const RIM_INK = "#948873"; // LAND -> INK at 0.5 (context): the rim
/** the flywheel arms and the stand's line, a step dimmer */
export const SPOKE_INK = "#867B67"; // LAND -> INK at 0.42
const INK_DEEP = "#D3C5A2";
const PED_FILL = "#2B231A"; // dark umber plane
const PED_FACE = "#352B20"; // a lit top face

export const FPS = 30000 / 1001;
export const DURATION = 204;

// ---------------------------------------------------------------------------
// GEOMETRY
// ---------------------------------------------------------------------------
export const SUN: P2 = [540, 960];
export const N_TEETH = 18;
export const PITCH_R = 88;
export const TIP_R = 98;
export const ROOT_R = 76;
export const CENTRE_D = 2 * PITCH_R;
export const RIM_R = 400;
export const ROD_LEN = 1500;
export const OMEGA_END = (2 * Math.PI) / 140;
const PITCH_A = (2 * Math.PI) / N_TEETH;
/** world y of the stand's flat foot (its underside); the machine stands on y = PEDESTAL_FOOT_Y */
export const PEDESTAL_FOOT_Y = 1910;
/** the flywheel's hub ring (world px): just outside the sun gear's tips, the arms run into it */
export const HUB_RING_R = 118;
/** the orrery seen from a little above: vertical squash of its horizontal orbit plane */
export const ORRERY_TILT0 = 0.3;
/** the Earth's orbit radius on the orrery (= the flywheel rim's radius) */
export const EARTH_R0 = 300;
/** the orrery's turn: one year per 102 frames */
export const ORRERY_OMEGA = (2 * Math.PI) / 102;

// legacy V1 values (the quill and the Kepler ellipse), kept for importers; V2 does not use them
export const ORBIT_A = 432;
export const ORBIT_E = 0.35;
export const ORBIT_W = (-40 * Math.PI) / 180;
export const THETA0 = 3.917689190075393;
export const P0: P2 = (() => {
  const r = (ORBIT_A * (1 - ORBIT_E * ORBIT_E)) / (1 + ORBIT_E * Math.cos(THETA0));
  return [SUN[0] + r * Math.cos(THETA0 + ORBIT_W), SUN[1] + r * Math.sin(THETA0 + ORBIT_W)];
})();

/** the cut-10 timeline (frames at 29.97) */
export const T = {
  // legacy V1 keys (unused)
  lineDone: 20,
  close: 88,
  dot: 98,
  release: 99,
  perihelion: 134,
  // the orrery
  traceTo: 150, // the Earth's traced orbit closes (one full turn, see TRACE_FROM)
  touch: 105, // "figuring": the lecturer's finger touches the Earth and sets the model going faster
  outerOut: [124, 132] as const, // "universe": the outer planet swings out from behind the lamp-Sun on its longer arm
  outerIn: [146, 154] as const, // ... and folds back behind it before the change
  people: [0, 144] as const,
  peopleOut: [144, 160] as const, // the Fellows step back into the dark
  // the change (orrery -> engine), coupled on "make" (f172)
  tilt: [148, 170] as const,
  morph: [148, 170] as const,
  planetIn: [148, 170] as const,
  armRise: [148, 168] as const,
  moonIn: [148, 148] as const,
  standMorph: [150, 172] as const,
  sunHarden: [148, 166] as const,
  sunOrange: [152, 166] as const,
  planetGrow: [148, 166] as const,
  planetTeeth: [150, 168] as const,
  engage: [166, 171] as const, // first tooth contact -> full mesh
  hubRing: [158, 165] as const,
  spokes: [164, 174] as const, // the arms grow from the hub ring out to the rim
  rimThick: [150, 168] as const,
  rimDrain: [170, 182] as const, // one smooth tone change, orange -> cream
  rodDescend: [158, 172] as const, // the beam swings down on its pivot (off frame), the rod hanging from its end ...
  rodCouple: 172, // ... and the rod couples to the planet's hub on "make"; the engine then spins up with weight
  pedestalRise: [172, 172] as const,
  settled: 190,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const prog = (f: number, [a, b]: readonly [number, number]) => (b === a ? (f >= b ? 1 : 0) : clamp01((f - a) / (b - a)));

// ---------------------------------------------------------------------------
// KINEMATICS: the orrery's turn, the lecturer's push, the slow change, the engine spinning up
// ---------------------------------------------------------------------------
const LAST = DURATION - 1;
const OMEGA_PUSHED = 0.085; // after the lecturer's touch
const OMEGA_MORPH = 0.03; // the model slows as it changes
const OMEGA_RUN = 0.09; // the engine at speed (sun gear and flywheel at twice this)
export const omegaAt = (f: number) => {
  if (f < T.touch) return ORRERY_OMEGA;
  if (f < 146) return lerp(ORRERY_OMEGA, OMEGA_PUSHED, smoothstep((f - T.touch) / 10));
  if (f < T.rodCouple) return lerp(OMEGA_PUSHED, OMEGA_MORPH, smoothstep((f - 146) / (T.rodCouple - 146)));
  return lerp(OMEGA_MORPH, OMEGA_RUN, smoothstep((f - T.rodCouple) / 24));
};
/** the Earth's screen angle at the touch: on the far right, within the lecturer's reach */
const ANG_TOUCH = (-40 * Math.PI) / 180;
const integ = (f0: number, f1: number) => {
  let a = 0;
  const n = Math.max(1, Math.round((f1 - f0) * 8));
  for (let i = 0; i < n; i++) a += omegaAt(f0 + ((i + 0.5) / n) * (f1 - f0)) * ((f1 - f0) / n);
  return a;
};
const ANG = (() => {
  const out = new Float64Array(LAST + 1);
  out[0] = ANG_TOUCH - integ(0, T.touch);
  for (let f = 1; f <= LAST; f++) out[f] = out[f - 1] + integ(f - 1, f);
  return out;
})();
const angAt = (f: number) => {
  if (f >= LAST) return ANG[LAST] + OMEGA_RUN * (f - LAST);
  if (f <= 0) return ANG[0] + ORRERY_OMEGA * f;
  const i = Math.floor(f);
  return lerp(ANG[i], ANG[i + 1], f - i);
};
/** the frame the Earth starts tracing its orbit: exactly one turn before T.traceTo */
const TRACE_FROM = (() => {
  let lo = 0;
  let hi = T.traceTo;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (angAt(T.traceTo) - angAt(mid) > 2 * Math.PI) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
const tiltAt = (f: number) => lerp(ORRERY_TILT0, 1, smootherstep(prog(f, T.tilt)));
const planetRAt = (f: number) => lerp(EARTH_R0, CENTRE_D, smootherstep(prog(f, T.planetIn)));
/** a point on the (tilted) orbit plane at radius r, screen angle a */
const onPlane = (r: number, a: number, s: number): P2 => [SUN[0] + r * Math.cos(a), SUN[1] + r * s * Math.sin(a)];
const planetPosAt = (f: number): P2 => onPlane(planetRAt(f), angAt(f), tiltAt(f));

// THE BEAM ENGINE: the beam pivots on a column at BEAM_PIVOT; its near end pin (the rod's top) is where a circle
// of BEAM_HALF round the pivot meets a circle of ROD_LEN_ENGINE round the planet pin (the rod's real length)
export const BEAM_HALF = 400;
export const ROD_LEN_ENGINE = 800;
export const BEAM_PIVOT: P2 = [SUN[0] + BEAM_HALF, SUN[1] - ROD_LEN_ENGINE];
/** the cylinder's cover (world y): below the lowest the beam's far end pin reaches */
export const CYL_COVER_Y = BEAM_PIVOT[1] + 330;
const beamEndOf = (p: P2): P2 => {
  const [x0, y0] = BEAM_PIVOT;
  const dx = p[0] - x0;
  const dy = p[1] - y0;
  const d = Math.hypot(dx, dy);
  const a = (BEAM_HALF * BEAM_HALF - ROD_LEN_ENGINE * ROD_LEN_ENGINE + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, BEAM_HALF * BEAM_HALF - a * a));
  const mx = x0 + (a * dx) / d;
  const my = y0 + (a * dy) / d;
  // the two meeting points; the beam end is the upper one (near the vertical through the shaft)
  const e1: P2 = [mx + (h * dy) / d, my - (h * dx) / d];
  const e2: P2 = [mx - (h * dy) / d, my + (h * dx) / d];
  return e1[1] < e2[1] ? e1 : e2;
};
/** the rod's lean (body rotation of the planet gear, which is fixed to the rod) */
const chiOf = (p: P2) => {
  const e = beamEndOf(p);
  return Math.atan2(e[0] - p[0], p[1] - e[1]);
};

// The sun gear: still until the planet's teeth touch, then driven (ramped in over the mesh window), then the
// exact rolling relation phi_sun = 2 theta - phi_planet + pi - pi/N.
const F_RAW = (f: number) => 2 * angAt(f) - chiOf(planetPosAt(f));
const PHI_S = (() => {
  const out = new Float64Array(LAST + 1);
  let phi = -Math.PI / 2;
  for (let f = 0; f <= LAST; f++) {
    if (f > T.engage[0]) {
      const w = smoothstep((f - 0.5 - T.engage[0]) / (T.engage[1] - T.engage[0]));
      phi += w * (F_RAW(f) - F_RAW(f - 1));
    }
    out[f] = phi;
  }
  return out;
})();
const phiSunAt = (f: number) => {
  if (f >= T.engage[1]) return PHI_S[T.engage[1]] + F_RAW(f) - F_RAW(T.engage[1]);
  if (f <= 0) return PHI_S[0];
  const i = Math.floor(f);
  return lerp(PHI_S[i], PHI_S[i + 1], f - i);
};
const PLANET_PHASE = F_RAW(T.engage[1]) - PHI_S[T.engage[1]] + Math.PI - Math.PI / N_TEETH;

export type MachinePhase = { theta: number; planet: P2; chi: number; phiP: number; phiS: number; rodTop: P2 };
/** the machine's kinematic state on any frame (identical to V1 from f178 on) */
export const machinePhaseAt = (frame: number): MachinePhase => {
  const planet = planetPosAt(frame);
  const chi = chiOf(planet);
  return {
    theta: angAt(frame) - ORBIT_W,
    planet,
    chi,
    phiP: chi + PLANET_PHASE,
    phiS: phiSunAt(frame),
    rodTop: beamEndOf(planet),
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA (cut 10). World point (wx, wy) at screen (sx, sy) at zoom k.
// Close on the orrery's Sun and arm -> pull back to the whole instrument (k
// ~0.98 by f100) -> ease in while the Earth traces -> V1's keys from f176 (so
// f176 on, and MACHINE_END_CAM, are exactly V1's).
// ---------------------------------------------------------------------------
// the cold-review camera: close on the lamp-Sun, the lecturer's face above it -> out to the whole group
// ("towering intellects") -> a slow push into the orbit while the planets turn -> through the change the
// camera holds the forming machine's size -> a pull-back that shows the beam, its pivot and column (f176-196)
const camRaw = makeCamera(
  [
    { f: 0, k: 2.1, wx: SUN[0], wy: SUN[1], sx: 540, sy: 680 },
    { f: 43, k: 1.3, wx: SUN[0], wy: SUN[1], sx: 540, sy: 690 },
    { f: 84, k: 0.98, wx: SUN[0], wy: SUN[1], sx: 540, sy: 700 },
    { f: 112, k: 1.0, wx: SUN[0], wy: SUN[1], sx: 540, sy: 715 },
    { f: 150, k: 1.24, wx: SUN[0], wy: SUN[1], sx: 548, sy: 780 },
    { f: 166, k: 1.16, wx: SUN[0], wy: SUN[1], sx: 545, sy: 800 },
    { f: 200, k: 0.8, wx: SUN[0], wy: SUN[1], sx: 340, sy: 960 },
    { f: 240, k: 0.785, wx: SUN[0], wy: SUN[1], sx: 338, sy: 962 },
  ],
  false,
);
/** cut 10's camera without the sway (k, cx, cy) */
export const camBaseAt = (frame: number): Cam => camRaw(frame);
/** cut 10's camera, the house sway included */
export const cutCamAt = (frame: number): Cam => swayCam(camRaw(frame), frame);
export const MACHINE_END_CAM: Cam = cutCamAt(LAST);
export const MACHINE_END_CAM_VEL: Cam = (() => {
  const a = cutCamAt(LAST - 1);
  const b = MACHINE_END_CAM;
  return { k: b.k - a.k, cx: b.cx - a.cx, cy: b.cy - a.cy };
})();

// ---------------------------------------------------------------------------
// THE STATE of the world on a frame
// ---------------------------------------------------------------------------
const EARTH_BALL_R = 32;
const SUN_BALL_R = 70;
const SUN_RAY_R = 132;
const ARM_DROP = 175; // the arm runs this far below the orbit plane on the orrery
const MOON_R = 46; // the Moon's arm
const ROD_DROP = 1700; // the rod's strap starts its descent this far above the hub (off frame)

export type WorldState = ReturnType<typeof worldStateAt>;
export const worldStateAt = (frame: number) => {
  const f = frame;
  const ph = machinePhaseAt(f);
  const hs = smootherstep(prog(f, T.sunHarden));
  const pg = smootherstep(prog(f, T.planetGrow));
  const pt = smootherstep(prog(f, T.planetTeeth));
  const tilt = tiltAt(f);
  const rimTilt = lerp(ORRERY_TILT0, 1, smootherstep(prog(f, T.morph)));
  const rimW = lerp(6, 54, smootherstep(prog(f, T.rimThick)));
  // the orbit trace: from the angle at T.traceFrom to the Earth now (closed from T.traceTo)
  const traceOn = f > TRACE_FROM;
  const traceClosed = f >= T.traceTo;
  const armFade = smoothstep(prog(f, [174, 178])); // behind the meshed gears the arm thins to V1's radius line
  return {
    frame: f,
    phase: ph,
    tilt,
    angle: angAt(f),
    // the trace / rim
    traceOn,
    traceClosed,
    traceA0: angAt(TRACE_FROM),
    rimR: lerp(EARTH_R0, RIM_R, smootherstep(prog(f, T.morph))),
    rimTilt,
    rimW,
    rimColor: mixColor(ACCENT, RIM_INK, smoothstep(prog(f, T.rimDrain))),
    rimGroove: smoothstep(prog(f, [162, 176])),
    // the Earth -> planet
    planetR: lerp(EARTH_BALL_R, ROOT_R, pg),
    planetTooth: (TIP_R - ROOT_R) * pt,
    planetDetail: smoothstep(prog(f, [168, 178])),
    armDrop: ARM_DROP * (1 - smootherstep(prog(f, T.armRise))),
    armW: lerp(13, 1.7, armFade),
    armColor: mixColor(ACCENT, INK, armFade),
    armOpacity: lerp(1, 0.72, armFade),
    moonR: 0 * MOON_R,
    moonAngle: angAt(f) * 2.6 + 1.1,
    // the sun
    sunHarden: hs,
    sunColor: mixColor(INK, ACCENT, smoothstep(prog(f, T.sunOrange))),
    sunDetail: smoothstep(prog(f, [160, 174])),
    // the stand
    standMorph: smootherstep(prog(f, T.standMorph)),
    // the flywheel arms, hub ring and rod
    spokeReach: 1 - Math.pow(1 - prog(f, T.spokes), 2.2),
    hubR: lerp(ROOT_R - 6, HUB_RING_R, smootherstep(prog(f, T.hubRing))),
    hubOn: f >= T.hubRing[0],
    rodOffset: f < T.rodDescend[0] ? null : ROD_DROP * Math.pow(1 - prog(f, T.rodDescend), 2.6),
    // V1 field names kept
    pedestalDy: 0,
    pedestalOn: true,
    lineA: RIM_R,
    lineE: 0,
  };
};

// ---------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------
const fx = (v: number) => v.toFixed(3);
const at = (c: P2, r: number, a: number) => `${fx(c[0] + r * Math.cos(a))} ${fx(c[1] + r * Math.sin(a))}`;
const dOf = (pts: P2[], close = false) => (pts.length ? `M${pts.map(([x, y]) => `${fx(x)},${fx(y)}`).join("L")}${close ? "Z" : ""}` : "");
/** the orbit plane's circle of radius r at squash s (points from screen angle ORBIT_W, as V1's rim) */
const planeCircle = (r: number, s: number, n = 360): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) pts.push(onPlane(r, (i / n) * 2 * Math.PI + ORBIT_W, s));
  return pts;
};
const planeArc = (r: number, s: number, a0: number, a1: number): P2[] => {
  const n = Math.max(2, Math.ceil(((a1 - a0) / (2 * Math.PI)) * 360));
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) pts.push(onPlane(r, a0 + ((a1 - a0) * i) / n, s));
  return pts;
};

/** a toothed outline (also the sun with its rays): N spikes on a disc. Half-widths in world px at rIn / rOut. */
const gearD = (c: P2, phase: number, rIn: number, rOut: number, hwIn: number, hwOut: number) => {
  const wIn = Math.min(hwIn / rIn, PITCH_A * 0.49);
  const wOut = Math.min(hwOut / rOut, wIn);
  let d = "";
  for (let k = 0; k < N_TEETH; k++) {
    const a = phase + k * PITCH_A;
    d += k === 0 ? `M${at(c, rIn, a - wIn)}` : `A${fx(rIn)} ${fx(rIn)} 0 0 1 ${at(c, rIn, a - wIn)}`;
    d += `L${at(c, rOut, a - wOut)}A${fx(rOut)} ${fx(rOut)} 0 0 1 ${at(c, rOut, a + wOut)}L${at(c, rIn, a + wIn)}`;
  }
  d += `A${fx(rIn)} ${fx(rIn)} 0 0 1 ${at(c, rIn, phase - wIn)}Z`;
  return d;
};
const TOOTH_HW_IN = 0.33 * PITCH_A * ROOT_R; // ~8.8 world px
const TOOTH_HW_OUT = 0.2 * PITCH_A * TIP_R; // ~6.8

/** engraved shading, ONE direction for the whole world: lines running lower-left -> upper-right, laid on
 *  the lower-right of a body (light from the upper left), heavier towards the shadow; clipped */
const Hatch: React.FC<{ c: P2; r: number; clip: string; opacity: number; color?: string; n?: number }> = ({ c, r, clip, opacity, color = ACCENT_DEEP, n = 9 }) => {
  if (opacity < 0.01) return null;
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const t = 0.18 + (i / (n - 1)) * 0.95; // along (1,1)/sqrt2, in units of r
    const ox = c[0] + (t * r) / Math.SQRT2;
    const oy = c[1] + (t * r) / Math.SQRT2;
    const L = r * 1.3;
    lines.push(
      <line key={i} x1={ox - L / Math.SQRT2} y1={oy + L / Math.SQRT2} x2={ox + L / Math.SQRT2} y2={oy - L / Math.SQRT2} stroke={color} strokeWidth={0.9 + 1.9 * (i / (n - 1))} />,
    );
  }
  return (
    <g clipPath={`url(#${clip})`} opacity={opacity}>
      {lines}
    </g>
  );
};
/** the same hatching for a box region (the stand's planes), in cream on the dark umber */
const BoxHatch: React.FC<{ x0: number; y0: number; x1: number; y1: number; clip: string; opacity: number; step?: number }> = ({ x0, y0, x1, y1, clip, opacity, step = 14 }) => {
  if (opacity < 0.01) return null;
  const lines: React.ReactNode[] = [];
  const w = x1 - x0;
  const h = y1 - y0;
  // only the right-hand (shadow) part: from the middle of the box rightwards
  for (let t = w * 0.45, i = 0; t < w + h; t += step, i++) {
    lines.push(<line key={i} x1={x0 + t - h} y1={y1} x2={x0 + t} y2={y0} stroke={SPOKE_INK} strokeWidth={1.2 + 0.6 * clamp01((t - w * 0.45) / w)} />);
  }
  return (
    <g clipPath={`url(#${clip})`} opacity={opacity}>
      {lines}
    </g>
  );
};

/** a finished gear's engraved detail: a cream ring, the hub boss, a key (or, on the sun gear, the shaft's nut) */
const GearDetail: React.FC<{ c: P2; phase: number; opacity: number; ringR: number; boss?: number; nut?: boolean }> = ({ c, phase, opacity, ringR, boss = 21, nut = false }) => {
  if (opacity < 0.01) return null;
  if (nut) {
    const hex = Array.from({ length: 6 }, (_, i) => at(c, 19, phase + (i * Math.PI) / 3 + Math.PI / 6)).join("L");
    return (
      <g opacity={opacity}>
        <circle cx={c[0]} cy={c[1]} r={ringR} fill="none" stroke={INK} strokeOpacity={0.85} strokeWidth={1.8} />
        <circle cx={c[0]} cy={c[1]} r={boss} fill={DARK} stroke={INK} strokeWidth={2.4} />
        <circle cx={c[0]} cy={c[1]} r={boss - 6} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={1.2} />
        <path d={`M${hex}Z`} fill={INK_DEEP} stroke={DARK} strokeWidth={2.6} strokeLinejoin="round" paintOrder="stroke" />
        <circle cx={c[0]} cy={c[1]} r={8.5} fill={INK} stroke={DARK} strokeWidth={1.6} />
        <path d={`M${at(c, 1.5, phase)}L${at(c, 8.5, phase)}`} stroke={DARK} strokeWidth={2.2} />
      </g>
    );
  }
  return (
    <g opacity={opacity}>
      <circle cx={c[0]} cy={c[1]} r={ringR} fill="none" stroke={INK} strokeOpacity={0.85} strokeWidth={1.8} />
      <circle cx={c[0]} cy={c[1]} r={boss} fill={DARK} stroke={INK} strokeWidth={2.4} />
      {boss > 24 ? <circle cx={c[0]} cy={c[1]} r={boss * 0.55} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={1.4} /> : null}
      <path
        d={`M${at(c, boss * 0.45, phase - 0.42 * (21 / boss))}L${at(c, boss - 1, phase - 0.2 * (21 / boss))}L${at(c, boss - 1, phase + 0.2 * (21 / boss))}L${at(c, boss * 0.45, phase + 0.42 * (21 / boss))}Z`}
        fill={INK}
        fillOpacity={0.9}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STAND: the orrery's turned baluster + drum (morph 0) -> the engine's A-frame + bearing block (morph 1,
// exactly V1's Pedestal). Dark umber planes in the context cream line, behind the flywheel.
// ---------------------------------------------------------------------------
const DRUM_RX0 = 200;
const DRUM_TOP0 = 250; // below SUN, the drum's top face centre-line on the orrery
const DRUM_BOT0 = 330;
export const Pedestal: React.FC<{ dy?: number; footY?: number; morph?: number; idPrefix?: string }> = ({ dy = 0, footY = PEDESTAL_FOOT_Y, morph = 1, idPrefix = "ped" }) => {
  const m = clamp01(morph);
  const cx = SUN[0];
  const sy = SUN[1];
  const ft = footY - 46; // top of the foot
  // the drum -> the bearing block
  const bx = lerp(DRUM_RX0, 214, m);
  const bTop = sy + lerp(DRUM_TOP0, -34, m);
  const bBot = sy + lerp(DRUM_BOT0, 64, m);
  const ry = DRUM_RX0 * ORRERY_TILT0 * (1 - smoothstep(m / 0.25)); // the drum's elliptical faces flatten into the block's edges
  const legTopY = bBot + ry * 0.5; // the legs (the baluster) leave from under the drum
  const legX = (inner: boolean, sgn: number, y: number) => {
    const u = (y - legTopY) / (ft - legTopY);
    const top = inner ? lerp(0, 62, m) : lerp(30, 128, m);
    const bot = inner ? lerp(0, 300, m) : lerp(50, 370, m);
    return cx + sgn * (top + (bot - top) * u);
  };
  const line = { fill: PED_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };
  const leg = (sgn: number) =>
    `M${fx(legX(true, sgn, legTopY))} ${fx(legTopY)}L${fx(legX(false, sgn, legTopY))} ${fx(legTopY)}L${fx(legX(false, sgn, ft))} ${fx(ft)}L${fx(legX(true, sgn, ft))} ${fx(ft)}Z`;
  const tieY0 = sy + 590;
  const tieY1 = sy + 628;
  const rib = (sgn: number) => `M${fx((legX(true, sgn, legTopY + 30) + legX(false, sgn, legTopY + 30)) / 2)} ${fx(legTopY + 30)}L${fx((legX(true, sgn, ft - 20) + legX(false, sgn, ft - 20)) / 2)} ${fx(ft - 20)}`;
  // the drum / block: a box with an elliptical bottom edge and top face (flat at m = 1)
  const boxD =
    ry > 0.05
      ? `M${fx(cx - bx)} ${fx(bTop)}L${fx(cx + bx)} ${fx(bTop)}L${fx(cx + bx)} ${fx(bBot)}A${fx(bx)} ${fx(ry)} 0 0 1 ${fx(cx - bx)} ${fx(bBot)}Z`
      : `M${fx(cx - 214)} ${fx(sy - 34)}L${fx(cx + 214)} ${fx(sy - 34)}L${fx(cx + 214)} ${fx(sy + 64)}L${fx(cx - 214)} ${fx(sy + 64)}Z`;
  const capH = 38 * smoothstep((m - 0.5) / 0.5);
  const colY = (u: number) => lerp(legTopY, ft, u);
  const colHalf = (u: number) => lerp(30, 50, u) + 10;
  // the baluster's three collars move with the change: the top one rises into the bearing block, the middle one
  // stretches into the cross-tie, the bottom one sinks into the foot (a rect with full corner radii is an ellipse)
  const tieMid = (tieY0 + tieY1) / 2;
  const tieHalf = (legX(true, 1, tieMid) - legX(true, -1, tieMid)) / 2 + 14;
  const collar = (y: number, hx: number, hy: number, r: number, key: string) => (
    <rect key={key} x={fx(cx - hx)} y={fx(y - hy)} width={fx(2 * hx)} height={fx(2 * hy)} rx={fx(Math.min(hx, hx * r + 2))} ry={fx(Math.min(hy, hy * r + 2))} fill={PED_FILL} stroke={SPOKE_INK} strokeWidth={3.2} />
  );
  const cTop = collar(lerp(colY(0.06), bTop + 20, m), colHalf(0.06), colHalf(0.06) * ORRERY_TILT0, 1 - m, "c0");
  const cMid = collar(lerp(colY(0.42), tieMid, m), lerp(colHalf(0.42), tieHalf, m), lerp(colHalf(0.42) * ORRERY_TILT0, (tieY1 - tieY0) / 2, m), 1 - m, "c1");
  const cBot = collar(lerp(colY(0.9), ft + 10, m), lerp(colHalf(0.9), 380, m), lerp(colHalf(0.9) * ORRERY_TILT0, 8, m), 1 - m, "c2");
  const boxClip = `${idPrefix}-box`;
  return (
    <g transform={`translate(0 ${fx(dy)})`}>
      <defs>
        <clipPath id={boxClip}>
          <path d={boxD} />
        </clipPath>
      </defs>
      {cMid}
      <path d={leg(-1)} {...line} />
      <path d={leg(1)} {...line} />
      <path d={rib(-1)} stroke={SPOKE_INK} strokeOpacity={0.45 * smoothstep((m - 0.35) / 0.4)} strokeWidth={1.4} fill="none" />
      <path d={rib(1)} stroke={SPOKE_INK} strokeOpacity={0.45 * smoothstep((m - 0.35) / 0.4)} strokeWidth={1.4} fill="none" />
      {cTop}
      {cBot}
      {/* the foot: a wide flat base with a plinth step */}
      <path d={`M${cx - 400} ${fx(ft)}L${cx + 400} ${fx(ft)}L${cx + 400} ${fx(ft + 20)}L${cx + 460} ${fx(ft + 20)}L${cx + 460} ${fx(footY)}L${cx - 460} ${fx(footY)}L${cx - 460} ${fx(ft + 20)}L${cx - 400} ${fx(ft + 20)}Z`} {...line} />
      {/* the drum (the orrery's gear box) -> the bearing block on the shaft, its cap and two bolts */}
      <path d={boxD} {...line} />
      <BoxHatch x0={cx - bx} y0={bTop} x1={cx + bx} y1={bBot + ry} clip={boxClip} opacity={0.35 * (1 - smoothstep(m / 0.5))} />
      {ry > 0.05 ? (
        <>
          <ellipse cx={cx} cy={bTop} rx={bx} ry={ry} fill={PED_FACE} stroke={SPOKE_INK} strokeWidth={3.2} />
          <ellipse cx={cx} cy={bTop} rx={bx * 0.78} ry={ry * 0.78} fill="none" stroke={SPOKE_INK} strokeOpacity={0.55 * (1 - smoothstep(m / 0.25))} strokeWidth={1.6} />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * 2 * Math.PI;
            return (
              <path
                key={i}
                d={`M${fx(cx + bx * 0.78 * Math.cos(a))} ${fx(bTop + ry * 0.78 * Math.sin(a))}L${fx(cx + bx * 0.86 * Math.cos(a))} ${fx(bTop + ry * 0.86 * Math.sin(a))}`}
                stroke={SPOKE_INK}
                strokeOpacity={0.55 * (1 - smoothstep(m / 0.25))}
                strokeWidth={1.4}
              />
            );
          })}
        </>
      ) : null}
      {capH > 0.05 ? <path d={`M${cx - 236} ${fx(bTop - capH)}L${cx + 236} ${fx(bTop - capH)}L${cx + 236} ${fx(bTop)}L${cx - 236} ${fx(bTop)}Z`} {...line} /> : null}
      {m > 0.7
        ? [-1, 1].map((g) => (
            <g key={g} opacity={smoothstep((m - 0.7) / 0.3)}>
              <circle cx={cx + g * 196} cy={bTop - 19} r={10} fill={DARK} stroke={SPOKE_INK} strokeWidth={2.2} />
              <path d={`M${cx + g * 196 - 6} ${fx(bTop - 19)}L${cx + g * 196 + 6} ${fx(bTop - 19)}`} stroke={SPOKE_INK} strokeWidth={1.6} />
            </g>
          ))
        : null}
      <path d={`M${fx(cx - bx + 10)} ${fx(bTop + 74)}L${fx(cx + bx - 10)} ${fx(bTop + 74)}`} stroke={SPOKE_INK} strokeOpacity={0.45 * m} strokeWidth={1.4} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FELLOWS (Wright of Derby's lecture on the orrery): three Royal Society gentlemen behind the orrery, their
// faces lit by its lamp-Sun; the lecturer stoops over it, straightens up tall on "towering intellects" and points
// at the Earth on its arm. They step back into the dark over T.peopleOut, before the change.
// ---------------------------------------------------------------------------
const LIT: Ink = { main: "#F6E9C8", deep: "#E3D2A8", hair: CREAM.hair };
const CREAM_COAT = shadeInk(0.8);
const DIM = shadeInk(0.04);
const reachTo = (q: FigPose, arm: "armL" | "armR", at: P2, scale: number, variant: number, target: P2, reach: number, t: number): FigPose => {
  const a = castAnchors("fellow", q, at, scale, variant);
  const sh = arm === "armL" ? a.shoulderL : a.shoulderR;
  const dx = target[0] - sh[0];
  const dy = target[1] - sh[1];
  const d = Math.hypot(dx, dy) || 1;
  const L = Math.min(d, reach * scale);
  const w: P2 = [(sh[0] + (dx / d) * L - at[0]) / scale, (sh[1] + (dy / d) * L - at[1]) / scale];
  const base = q[arm];
  return { ...q, [arm]: { w: [lerp(base.w[0], w[0], t), lerp(base.w[1], w[1], t)] as P2, elbow: [0.4, 1] as P2, fist: lerp(base.fist, 0.75, t), hand: lerp(base.hand, -10, t) } };
};
/** the lecturer (centre, behind the orrery, his face over the lamp), a Fellow on each side */
export const LECTURER = { at: [SUN[0] + 20, 1320] as P2, scale: 2.3, variant: 3 };
const SIDE_L = { at: [SUN[0] - 375, 1450] as P2, scale: 2.45, variant: 1 };
const SIDE_R = { at: [SUN[0] + 382, 1450] as P2, scale: 2.45, variant: 2 };
/** the lecturer turns on this frame and walks off right, out of frame before the change */
const LECT_TURN = 110;
const lectWalked = (f: number) => {
  // accelerating to 24 world px per frame over 8 frames (he hurries off)
  const t = f - LECT_TURN;
  return t <= 0 ? 0 : t <= 8 ? (27 * t * t) / 16 : 27 * 4 + 27 * (t - 8);
};
/** where the lecturer points while he talks: the near-right of the Earth's orbit */
const POINT_AT: P2 = [SUN[0] + 230, SUN[1] + 50];
export const Fellows: React.FC<{ frame: number; earth: P2; idPrefix: string }> = ({ frame, earth, idPrefix }) => {
  const f = frame;
  const out = smoothstep(prog(f, T.peopleOut));
  if (out >= 0.999) return null;
  const breathe = (q: FigPose, seed: number): FigPose => ({ ...q, pitch: q.pitch + 0.8 * Math.sin(f / 17 + seed), lean: q.lean + 0.5 * Math.sin(f / 23 + seed * 1.7) });
  // the lecturer: bent over the lamp, straightening tall on "towering intellects"; he points at the orbit, then on
  // "figuring" (f105) his finger meets the Earth and pushes it on
  const L = LECTURER;
  const st = smoothstep(prog(f, [62, 84]));
  const bentQ: FigPose = { ...POSES.front(), pitch: 16, crouch: 12, lean: 2 };
  const tallQ: FigPose = { ...POSES.front(), pitch: 5, crouch: 0, brow: -0.3, mouth: 0.2 };
  // the head stays square to us (yaw 0: the rig draws a clean face at 0 and at ~0.9, never between)
  let qL = headTurn(breathe(lerpFig(bentQ, tallQ, st), 0.4), 0, lerp(14, 6, st));
  const touchW = smoothstep(prog(f, [95, 103])) * (1 - smoothstep(prog(f, [105, 110])));
  const target: P2 = [lerp(POINT_AT[0], earth[0], touchW), lerp(POINT_AT[1], earth[1], touchW)];
  qL = reachTo(qL, "armR", L.at, L.scale, L.variant, target, 125, smoothstep(prog(f, [28, 48])) * (1 - smoothstep(prog(f, [105, 110]))));
  // then he turns (one frame: a clean front -> a clean three-quarter) and walks briskly off to the right
  let atL: P2 = L.at;
  if (f >= LECT_TURN) {
    const d = lectWalked(f);
    atL = [L.at[0] + d, L.at[1]];
    const amt = smoothstep((f - LECT_TURN) / 4);
    qL = breathe(lerpFig({ ...POSES.walk(1, 0, 0), yaw: 0.9, headYaw: 0.9 }, { ...POSES.walk(1, d / (2 * WALK.stride * L.scale)), headYaw: 0.9 }, amt), 0.4);
  }
  // the side Fellows lean in towards the lamp; as the camera pushes into the orbit they step back into the dark
  // first (so neither is ever a sliver at the frame edge)
  const outS = Math.max(out, smoothstep(prog(f, [114, 132])));
  const inkS = mixInk(LIT, DIM, outS);
  const coatS = (t: number) => shadeInk(lerp(t, 0.04, outS));
  const slideS = 50 * outS;
  // they stroll in from either side to join the lecturer ("people", f43), then lean in towards the lamp
  const walkIn = (x0: number, x1: number, dir: 1 | -1, scale: number, standQ: FigPose, seed: number) => {
    const u = prog(f, [0, 40]);
    const e = 1 - Math.pow(1 - u, 2.2); // decelerating to a stop
    const x = lerp(x0, x1, e);
    const amount = 1 - smoothstep(prog(f, [30, 42]));
    const phase = Math.abs(x - x0) / (2 * GENT_STRIDE * scale);
    // walking at the standing pose's clean three-quarter yaws (body 0.62, head 0.9), so no frame shows a split face
    const walkQ = { ...POSES.strollGent(dir, phase, 1), yaw: dir * 0.62, headYaw: dir * 0.9 };
    const q = amount > 0.001 ? lerpFig(standQ, walkQ, amount) : standQ;
    return { x, q: breathe(q, seed) };
  };
  const wA = walkIn(SIDE_L.at[0] - 260, SIDE_L.at[0], 1, SIDE_L.scale, headTurn({ ...POSES.stand(1), lean: 4, pitch: 8, crouch: 2 }, 0.9, 6), 1.3);
  const wB = walkIn(SIDE_R.at[0] + 260, SIDE_R.at[0], -1, SIDE_R.scale, headTurn({ ...POSES.stand(-1), lean: -4, pitch: 8, crouch: 2 }, -0.9, 6), 2.1);
  const atA: P2 = [wA.x - slideS, SIDE_L.at[1]];
  const qA = wA.q;
  const atB: P2 = [wB.x + slideS, SIDE_R.at[1]];
  const qB = wB.q;
  return (
    <g>
      {outS < 0.999 ? <Fellow variant={SIDE_L.variant} pose={qA} at={atA} scale={SIDE_L.scale} uid={`${idPrefix}-fA`} coat={coatS(0.78)} ink={inkS} /> : null}
      {outS < 0.999 ? <Fellow variant={SIDE_R.variant} pose={qB} at={atB} scale={SIDE_R.scale} uid={`${idPrefix}-fB`} coat={coatS(0.72)} ink={inkS} /> : null}
      {atL[0] < SUN[0] + 1100 ? <Fellow variant={L.variant} pose={qL} at={atL} scale={L.scale} uid={`${idPrefix}-fL`} coat={CREAM_COAT} ink={LIT} /> : null}
    </g>
  );
};

/** the whole world on a frame, in world px under the camera */
export const OrbitScene: React.FC<{ frame: number; cam: Cam; idPrefix?: string; pedestal?: boolean; footY?: number }> = ({
  frame,
  cam,
  idPrefix = "orb",
  pedestal = true,
  footY = PEDESTAL_FOOT_Y,
}) => {
  const s = worldStateAt(frame);
  const ph = s.phase;
  const sunClip = `${idPrefix}-sun`;
  const planetClip = `${idPrefix}-planet`;
  const settled = frame >= T.settled;

  // the trace -> rim
  let lineD = "";
  if (s.traceClosed) lineD = dOf(planeCircle(s.rimR, s.rimTilt), true);
  else if (s.traceOn) lineD = dOf(planeArc(s.rimR, s.rimTilt, s.traceA0, s.angle));

  // the sun: ball with rays -> sun gear
  const h = s.sunHarden;
  const sunRIn = lerp(SUN_BALL_R, ROOT_R, h);
  const sunROut = lerp(SUN_RAY_R, TIP_R, h);
  const sunD = gearD(SUN, ph.phiS, sunRIn, sunROut, lerp(2.2, TOOTH_HW_IN, h), lerp(0.7, TOOTH_HW_OUT, h));
  const shortRayOut = lerp(102, 60, h);

  // the Earth -> planet gear
  const pr = s.planetR;
  const planetD =
    s.planetTooth > 0.05 ? gearD(ph.planet, ph.phiP, pr, pr + s.planetTooth, TOOTH_HW_IN, lerp(TOOTH_HW_IN, TOOTH_HW_OUT, s.planetTooth / (TIP_R - ROOT_R))) : "";
  const near = settled || frame >= 160 || Math.sin(s.angle) > 0; // the Earth on the near side of the Sun (or a gear: always in front)

  // the flywheel arms (in the tilting plane)
  const spokes: React.ReactNode[] = [];
  if (s.spokeReach > 0.001) {
    const rimInner = s.rimR - s.rimW / 2 + 2;
    const r0 = 40;
    const r1 = lerp(r0, rimInner, s.spokeReach);
    const sq = s.rimTilt;
    for (let i = 0; i < 6; i++) {
      const a = ph.phiS + (i * Math.PI) / 3 + Math.PI / 6;
      const hw0 = 27;
      const hw1 = lerp(27, 16, (r1 - r0) / (rimInner - r0));
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const P = (r: number, w: number): string => `${fx(SUN[0] + r * ca - w * sa)} ${fx(SUN[1] + (r * sa + w * ca) * sq)}`;
      spokes.push(<path key={i} d={`M${P(r0, -hw0)}L${P(r1, -hw1)}L${P(r1, hw1)}L${P(r0, hw0)}Z`} fill={SPOKE_INK} stroke={DARK} strokeWidth={3.4} strokeLinejoin="round" paintOrder="stroke" />);
      spokes.push(<path key={`g${i}`} d={`M${P(r0 + 30, 0)}L${P(Math.max(r0 + 30, r1 - 14), 0)}`} stroke={DARK} strokeOpacity={0.35} strokeWidth={1.4} />);
    }
  }

  // the orrery's pillar: from the drum's top face up to the Sun (it shortens away as the drum rises to the shaft)
  const m = s.standMorph;
  const drumTop = SUN[1] + lerp(DRUM_TOP0, -34, m);
  const pillar =
    drumTop > SUN[1] + 20 ? (
      <g>
        <path
          d={`M${fx(SUN[0] - 11)} ${fx(SUN[1])}L${fx(SUN[0] + 11)} ${fx(SUN[1])}L${fx(SUN[0] + 15)} ${fx(drumTop)}L${fx(SUN[0] - 15)} ${fx(drumTop)}Z`}
          fill={PED_FILL}
          stroke={SPOKE_INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        {[0.55, 0.92].map((u, i) => {
          const y = lerp(SUN[1], drumTop, u);
          return y > SUN[1] + SUN_BALL_R ? <ellipse key={i} cx={SUN[0]} cy={y} rx={21} ry={6.5} fill={PED_FILL} stroke={SPOKE_INK} strokeWidth={2.4} /> : null;
        })}
      </g>
    ) : null;

  // the Earth's arm: from its collar on the pillar, below the plane, out to the stalk under the Earth
  const p = ph.planet;
  const rootY = SUN[1] + s.armDrop;
  const armEnd: P2 = [p[0], p[1] + s.armDrop];
  const arm = (
    <g>
      {frame < 178 ? (
        <path d={`M${fx(SUN[0])} ${fx(rootY)}L${fx(armEnd[0])} ${fx(armEnd[1])}`} stroke={DARK} strokeOpacity={s.armOpacity} strokeWidth={s.armW + 6.8 * (1 - smoothstep(prog(frame, [174, 178])))} strokeLinecap="round" />
      ) : null}
      <path d={`M${fx(SUN[0])} ${fx(rootY)}L${fx(armEnd[0])} ${fx(armEnd[1])}`} stroke={s.armColor} strokeOpacity={s.armOpacity} strokeWidth={s.armW} strokeLinecap="round" />
      {s.armDrop > 1 ? (
        <>
          <path d={`M${fx(armEnd[0])} ${fx(armEnd[1])}L${fx(p[0])} ${fx(p[1])}`} stroke={DARK} strokeWidth={8 + 6.8} strokeLinecap="round" />
          <path d={`M${fx(armEnd[0])} ${fx(armEnd[1])}L${fx(p[0])} ${fx(p[1])}`} stroke={ACCENT} strokeWidth={8} strokeLinecap="round" />
          <ellipse cx={SUN[0]} cy={rootY} rx={22} ry={8} fill={ACCENT} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        </>
      ) : null}
    </g>
  );

  // the Moon on its little arm (in the orbit plane round the Earth), behind the Earth when on the far side
  const moon =
    s.moonR > 1
      ? (() => {
          const q: P2 = [p[0] + s.moonR * Math.cos(s.moonAngle), p[1] + s.moonR * s.tilt * Math.sin(s.moonAngle)];
          return {
            behind: frame >= T.moonIn[0] || Math.sin(s.moonAngle) < 0,
            node: (
              <g>
                <path d={`M${fx(p[0])} ${fx(p[1])}L${fx(q[0])} ${fx(q[1])}`} stroke={DARK} strokeWidth={4 + 5} strokeLinecap="round" />
                <path d={`M${fx(p[0])} ${fx(p[1])}L${fx(q[0])} ${fx(q[1])}`} stroke={ACCENT} strokeWidth={4} strokeLinecap="round" />
                <circle cx={q[0]} cy={q[1]} r={9} fill={INK} stroke={DARK} strokeWidth={3} paintOrder="stroke" />
              </g>
            ),
          };
        })()
      : null;

  const earth =
    planetD ? (
      <>
        <path d={planetD} fill={ACCENT} stroke={DARK} strokeWidth={3.4} strokeLinejoin="round" paintOrder="stroke" />
        <Hatch c={p} r={pr + s.planetTooth} clip={planetClip} opacity={0.8} />
        <GearDetail c={p} phase={ph.phiP} opacity={s.planetDetail} ringR={56} />
      </>
    ) : (
      <>
        <circle cx={p[0]} cy={p[1]} r={pr} fill={ACCENT} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        <Hatch c={p} r={pr} clip={planetClip} opacity={0.8} n={6} />
      </>
    );
  const earthGroup = (
    <g>
      {moon && moon.behind ? moon.node : null}
      {earth}
      {moon && !moon.behind ? moon.node : null}
    </g>
  );

  // THE BEAM ENGINE: the column and beam (from T.rodDescend on; off frame until the pull-back), the rod from the
  // planet's hub to the beam end; the rod comes down from above and couples on "make"
  let engine: React.ReactNode = null;
  let rod: React.ReactNode = null;
  if (s.rodOffset !== null) {
    const P = BEAM_PIVOT;
    // the beam swings in on its pivot: rotated up by delta, settling at the linkage's angle on "make"
    const delta = 1.05 * Math.pow(1 - smoothstep(prog(frame, T.rodDescend)), 1.4);
    const E0 = ph.rodTop;
    const rotP = (v: P2, a: number): P2 => [P[0] + (v[0] - P[0]) * Math.cos(a) - (v[1] - P[1]) * Math.sin(a), P[1] + (v[0] - P[0]) * Math.sin(a) + (v[1] - P[1]) * Math.cos(a)];
    const E = rotP(E0, delta);
    const C: P2 = [2 * P[0] - E[0], 2 * P[1] - E[1]];
    const bl = BEAM_HALF;
    const bx = (E[0] - P[0]) / bl;
    const by = (E[1] - P[1]) / bl;
    const bq = (t: number, w: number): string => `${fx(P[0] + bx * t - by * w)} ${fx(P[1] + by * t + bx * w)}`;
    const hwP = 30;
    const hwE = 17;
    const end = bl + 26;
    const beamD = `M${bq(-end, -hwE)}L${bq(0, -hwP)}L${bq(end, -hwE)}A${hwE} ${hwE} 0 0 1 ${bq(end, hwE)}L${bq(0, hwP)}L${bq(-end, hwE)}A${hwE} ${hwE} 0 0 1 ${bq(-end, -hwE)}Z`;
    const ironL = { fill: PED_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };
    const colTop = P[1] + 26;
    // the cylinder under the beam's far end: its cover at CYL_COVER_Y, the piston rod from the far end pin down into it
    const cx2 = P[0] + BEAM_HALF;
    const cyHW = 96;
    const coverY = CYL_COVER_Y;
    const floorY = PEDESTAL_FOOT_Y - 46;
    engine = (
      <g>
        {/* the column under the beam's pivot, its capital */}
        <path d={`M${fx(P[0] - 34)} ${fx(colTop + 30)}L${fx(P[0] + 34)} ${fx(colTop + 30)}L${fx(P[0] + 50)} ${fx(floorY)}L${fx(P[0] - 50)} ${fx(floorY)}Z`} {...ironL} />
        <path d={`M${fx(P[0] + 10)} ${fx(colTop + 50)}L${fx(P[0] + 16)} ${fx(floorY - 24)}`} stroke={SPOKE_INK} strokeOpacity={0.45} strokeWidth={1.4} />
        <path d={`M${fx(P[0] - 56)} ${fx(colTop)}L${fx(P[0] + 56)} ${fx(colTop)}L${fx(P[0] + 56)} ${fx(colTop + 30)}L${fx(P[0] - 56)} ${fx(colTop + 30)}Z`} {...ironL} />
        {/* the piston rod (cream) from the far end pin down into the cylinder */}
        <path d={`M${fx(C[0] - 10)} ${fx(C[1])}L${fx(C[0] + 10)} ${fx(C[1])}L${fx(C[0] + 10)} ${fx(coverY + 10)}L${fx(C[0] - 10)} ${fx(coverY + 10)}Z`} fill={INK} stroke={DARK} strokeWidth={3.2} strokeLinejoin="round" paintOrder="stroke" />
        {/* the cylinder: body, flanges and the cover with its stuffing box (dark umber, cream engraved edges) */}
        <path d={`M${fx(cx2 - cyHW)} ${fx(coverY + 30)}L${fx(cx2 + cyHW)} ${fx(coverY + 30)}L${fx(cx2 + cyHW)} ${fx(floorY)}L${fx(cx2 - cyHW)} ${fx(floorY)}Z`} {...ironL} />
        <path d={`M${fx(cx2 + cyHW * 0.45)} ${fx(coverY + 60)}L${fx(cx2 + cyHW * 0.45)} ${fx(floorY - 20)}`} stroke={SPOKE_INK} strokeOpacity={0.4} strokeWidth={1.4} />
        {[0.28, 0.62].map((u) => {
          const y = lerp(coverY + 30, floorY, u);
          return <path key={u} d={`M${fx(cx2 - cyHW - 10)} ${fx(y - 12)}L${fx(cx2 + cyHW + 10)} ${fx(y - 12)}L${fx(cx2 + cyHW + 10)} ${fx(y + 12)}L${fx(cx2 - cyHW - 10)} ${fx(y + 12)}Z`} {...ironL} />;
        })}
        <path d={`M${fx(cx2 - cyHW - 18)} ${fx(coverY + 34)}L${fx(cx2 - cyHW + 6)} ${fx(coverY)}L${fx(cx2 + cyHW - 6)} ${fx(coverY)}L${fx(cx2 + cyHW + 18)} ${fx(coverY + 34)}Z`} {...ironL} />
        <path d={`M${fx(cx2 - 30)} ${fx(coverY - 30)}L${fx(cx2 + 30)} ${fx(coverY - 30)}L${fx(cx2 + 30)} ${fx(coverY + 2)}L${fx(cx2 - 30)} ${fx(coverY + 2)}Z`} {...ironL} />
        {/* the beam: cream, tapered to its ends, an engraved centre line, rocking on its pivot */}
        <path d={beamD} fill={INK} stroke={DARK} strokeWidth={3.4} strokeLinejoin="round" paintOrder="stroke" />
        <path d={`M${bq(-bl + 24, 0)}L${bq(bl - 24, 0)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.6} />
        <circle cx={P[0]} cy={P[1]} r={30} fill={INK} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        <circle cx={P[0]} cy={P[1]} r={9} fill={DARK} />
        <circle cx={C[0]} cy={C[1]} r={20} fill={INK} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        <circle cx={C[0]} cy={C[1]} r={6} fill={DARK} />
      </g>
    );
    // the rod hangs from the beam's end pin towards the planet's hub (full length; it reaches the hub on "make")
    const dxr = p[0] - E[0];
    const dyr = p[1] - E[1];
    const dr = Math.hypot(dxr, dyr) || 1;
    const ux = dxr / dr;
    const uy = dyr / dr;
    const Lr = ROD_LEN_ENGINE;
    const hw = 14;
    const q = (t: number, w: number): string => `${fx(E[0] + ux * t - uy * w)} ${fx(E[1] + uy * t + ux * w)}`;
    const eye: P2 = [E[0] + ux * Lr, E[1] + uy * Lr];
    rod = (
      <g>
        <path d={`M${q(0, -hw)}L${q(Lr, -hw)}L${q(Lr, hw)}L${q(0, hw)}Z`} fill={INK} stroke={DARK} strokeWidth={3.4} strokeLinejoin="round" paintOrder="stroke" />
        <path d={`M${q(30, -5.5)}L${q(Lr - 46, -5.5)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.4} />
        <path d={`M${q(Lr - 44, -20)}L${q(Lr - 14, -20)}L${q(Lr - 14, 20)}L${q(Lr - 44, 20)}Z`} fill={INK} stroke={DARK} strokeWidth={3.2} strokeLinejoin="round" paintOrder="stroke" />
        <path d={`M${q(Lr - 36, -20)}L${q(Lr - 36, 20)}`} stroke={DARK} strokeOpacity={0.5} strokeWidth={1.4} />
        <circle cx={eye[0]} cy={eye[1]} r={30} fill={INK} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        <circle cx={eye[0]} cy={eye[1]} r={13} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={1.4} />
        <circle cx={eye[0]} cy={eye[1]} r={8} fill={DARK} />
        <circle cx={E[0]} cy={E[1]} r={22} fill={INK} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        <circle cx={E[0]} cy={E[1]} r={7} fill={DARK} />
      </g>
    );
  }

  // the outer planet ("universe"): on its own longer arm from a lower collar, it swings out from behind the
  // lamp-Sun across the far side of the model and folds back behind it before the change
  const extO = smoothstep(prog(frame, T.outerOut)) * (1 - smoothstep(prog(frame, T.outerIn)));
  let outer: React.ReactNode = null;
  if (extO > 0.001) {
    const b = (-170 * Math.PI) / 180 + 0.093 * (frame - T.outerOut[0]);
    const ro = 470 * extO;
    const op = onPlane(ro, b, s.tilt);
    const dropO = 140;
    const ae: P2 = [op[0], op[1] + dropO];
    outer = (
      <g>
        <path d={`M${fx(SUN[0])} ${fx(SUN[1] + dropO)}L${fx(ae[0])} ${fx(ae[1])}`} stroke={DARK} strokeWidth={10 + 6.8} strokeLinecap="round" />
        <path d={`M${fx(SUN[0])} ${fx(SUN[1] + dropO)}L${fx(ae[0])} ${fx(ae[1])}`} stroke={ACCENT} strokeWidth={10} strokeLinecap="round" />
        <path d={`M${fx(ae[0])} ${fx(ae[1])}L${fx(op[0])} ${fx(op[1])}`} stroke={DARK} strokeWidth={7 + 6.8} strokeLinecap="round" />
        <path d={`M${fx(ae[0])} ${fx(ae[1])}L${fx(op[0])} ${fx(op[1])}`} stroke={ACCENT} strokeWidth={7} strokeLinecap="round" />
        <ellipse cx={SUN[0]} cy={SUN[1] + dropO} rx={20} ry={7} fill={ACCENT} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        <circle cx={op[0]} cy={op[1]} r={25} fill={ACCENT} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        <path d={`M${fx(op[0] + 4)} ${fx(op[1] + 22)}A25 25 0 0 0 ${fx(op[0] + 22)} ${fx(op[1] + 6)}`} stroke={ACCENT_DEEP} strokeWidth={6} fill="none" />
      </g>
    );
  }

  return (
    <WorldSvg cam={cam}>
      <defs>
        <clipPath id={sunClip}>
          <path d={sunD} />
        </clipPath>
        <clipPath id={planetClip}>{planetD ? <path d={planetD} /> : <circle cx={p[0]} cy={p[1]} r={pr} />}</clipPath>
      </defs>

      {frame < T.peopleOut[1] ? (
        <>
          <defs>
            <radialGradient id={`${idPrefix}-lamp`} cx={SUN[0]} cy={SUN[1]} r={760} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#F3DCA2" stopOpacity={0.2} />
              <stop offset="0.45" stopColor="#F3DCA2" stopOpacity={0.07} />
              <stop offset="1" stopColor="#F3DCA2" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={SUN[0]} cy={SUN[1]} r={760} fill={`url(#${idPrefix}-lamp)`} opacity={1 - smoothstep(prog(frame, T.peopleOut))} />
          <Fellows frame={frame} earth={ph.planet} idPrefix={idPrefix} />
        </>
      ) : null}
      {pedestal ? <Pedestal dy={s.pedestalDy} footY={footY} morph={m} idPrefix={`${idPrefix}-ped`} /> : null}
      {pillar}
      {outer}
      {!near ? arm : null}
      {!near ? earthGroup : null}
      {engine}
      {spokes}
      {s.hubOn ? (
        <g>
          <ellipse cx={SUN[0]} cy={SUN[1]} rx={s.hubR} ry={s.hubR * s.rimTilt} fill={SPOKE_INK} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
          <ellipse cx={SUN[0]} cy={SUN[1]} rx={Math.max(0, s.hubR - 9)} ry={Math.max(0, s.hubR - 9) * s.rimTilt} fill="none" stroke={DARK} strokeOpacity={0.4} strokeWidth={1.6} />
          {Array.from({ length: 6 }, (_, i) => {
            const a = ph.phiS + (i * Math.PI) / 3;
            const b = onPlane(s.hubR - 4.5, a, s.rimTilt);
            return <circle key={i} cx={b[0]} cy={b[1]} r={3.6} fill={DARK} fillOpacity={0.7} />;
          })}
        </g>
      ) : null}

      {/* the Earth's traced orbit, later the flywheel's rim */}
      {lineD ? (
        <g fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d={lineD} stroke={DARK} strokeOpacity={lerp(0.6, 0.85, s.rimGroove)} strokeWidth={s.rimW + lerp(4, 7, s.rimGroove)} />
          <path d={lineD} stroke={s.rimColor} strokeWidth={s.rimW} />
          {s.rimGroove > 0.01 ? (
            <>
              <path d={dOf(planeCircle(s.rimR - s.rimW * 0.36, s.rimTilt), true)} stroke={DARK} strokeOpacity={0.55 * s.rimGroove} strokeWidth={2} />
              <path d={dOf(planeCircle(s.rimR - s.rimW * 0.43, s.rimTilt), true)} stroke={DARK} strokeOpacity={0.22 * s.rimGroove} strokeWidth={s.rimW * 0.12} />
              <path d={dOf(planeCircle(s.rimR + s.rimW * 0.32, s.rimTilt), true)} stroke={INK} strokeOpacity={0.4 * s.rimGroove} strokeWidth={1.4} />
            </>
          ) : null}
        </g>
      ) : null}

      {near && frame >= 160 ? arm : null}

      {/* the sun: short rays (swallowed as the ball grows into the gear's body), the ball with its long rays / teeth */}
      {sunRIn < shortRayOut
        ? Array.from({ length: N_TEETH }, (_, k) => {
            const a = ph.phiS + (k + 0.5) * PITCH_A;
            return <path key={k} d={`M${at(SUN, sunRIn - 2, a)}L${at(SUN, shortRayOut, a)}`} stroke={DARK} strokeWidth={4.4} strokeLinecap="round" />;
          })
        : null}
      {sunRIn < shortRayOut
        ? Array.from({ length: N_TEETH }, (_, k) => {
            const a = ph.phiS + (k + 0.5) * PITCH_A;
            return <path key={k} d={`M${at(SUN, sunRIn - 2, a)}L${at(SUN, shortRayOut, a)}`} stroke={s.sunColor} strokeWidth={2} strokeLinecap="round" />;
          })
        : null}
      <path d={sunD} fill={s.sunColor} stroke={DARK} strokeWidth={lerp(2.6, 3.4, h)} strokeLinejoin="round" paintOrder="stroke" />
      <Hatch c={SUN} r={sunRIn} clip={sunClip} opacity={(1 - smoothstep(prog(frame, T.sunOrange))) * 0.55} color={DARK} n={7} />
      <Hatch c={SUN} r={sunROut} clip={sunClip} opacity={smoothstep(prog(frame, T.sunOrange)) * 0.8} />
      {h < 0.6 ? <circle cx={SUN[0]} cy={SUN[1]} r={sunRIn * 0.62} fill="none" stroke={DARK} strokeOpacity={0.45 * (1 - h / 0.6)} strokeWidth={1.6} /> : null}
      <GearDetail c={SUN} phase={ph.phiS} opacity={s.sunDetail} ringR={58} boss={32} nut />

      {near && frame < 160 ? arm : null}
      {near ? earthGroup : null}

      {rod}
    </WorldSvg>
  );
};

/** the settled machine (frames >= T.settled), turning: what cut 42 continues */
export const SunAndPlanetMachine: React.FC<{ frame: number; cam: Cam; idPrefix?: string; pedestal?: boolean; footY?: number }> = ({ frame, cam, idPrefix, pedestal, footY }) => (
  <OrbitScene frame={Math.max(frame, T.settled)} cam={cam} idPrefix={idPrefix} pedestal={pedestal} footY={footY} />
);
