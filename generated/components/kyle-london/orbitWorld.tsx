// ---------------------------------------------------------------------------
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
export const EARTH_R0 = RIM_R;
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
  // legacy V1 keys (unused by V2)
  lineDone: 20,
  close: 88,
  dot: 98,
  release: 99,
  perihelion: 134,
  // V2
  traceFrom: 48, // the Earth starts tracing its orbit; one full turn (102 frames) by f150
  traceTo: 150,
  tilt: [150, 174] as const, // the orbit plane tilts up to face us
  morph: [150, 172] as const, // the traced orbit tilts up into the rim
  planetIn: [150, 174] as const, // the Earth's arm shortens to CENTRE_D (it never stops turning)
  armRise: [150, 172] as const, // the arm rises into the Sun's plane (the stalk shortens to nothing)
  moonIn: [150, 162] as const, // the Moon's arm retracts into the Earth
  standMorph: [152, 178] as const, // baluster + drum -> A-frame + bearing block
  sunHarden: [150, 170] as const, // rays -> teeth
  sunOrange: [154, 170] as const,
  planetGrow: [150, 170] as const,
  planetTeeth: [152, 172] as const,
  engage: [168, 175] as const, // first tooth contact -> full mesh: the sun gear starts to turn
  spokes: [168, 180] as const, // the arms grow from the hub out to the formed rim
  rimThick: [152, 174] as const,
  hubRing: [165, 172] as const,
  rodDescend: [163, 178] as const, // the rod comes down from off frame and settles onto the hub
  rodCouple: 178, // from here the planet is driven at OMEGA_END (as V1)
  pedestalRise: [178, 178] as const, // V1 key: the stand no longer rises (it is the orrery's)
  settled: 186,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const prog = (f: number, [a, b]: readonly [number, number]) => (b === a ? (f >= b ? 1 : 0) : clamp01((f - a) / (b - a)));

// ---------------------------------------------------------------------------
// KINEMATICS: the orrery's turn becoming the machine's
// ---------------------------------------------------------------------------
const LAST = DURATION - 1;
/** V1's machine state at f203, reproduced exactly so the settled machine is unchanged */
const ANG_END = 10.340365169259531 + ORBIT_W; // the planet's screen angle at f203
const PHI_S_END = 1.1041826511413042;
const PHI_P_END = 22.54360741576812;

const omegaAt = (f: number) => lerp(ORRERY_OMEGA, OMEGA_END, smoothstep((f - 150) / 28));
/** the planet's screen angle per frame, integrated back from ANG_END (constant OMEGA_END from f178) */
const ANG = (() => {
  const out = new Float64Array(LAST + 1);
  out[LAST] = ANG_END;
  for (let f = LAST; f > 0; f--) {
    let a = out[f];
    for (let s = 0; s < 8; s++) a -= omegaAt(f - (s + 0.5) / 8) / 8;
    out[f - 1] = a;
  }
  return out;
})();
const angAt = (f: number) => {
  if (f >= LAST) return ANG_END + OMEGA_END * (f - LAST);
  if (f <= 0) return ANG[0] + ORRERY_OMEGA * f;
  const i = Math.floor(f);
  return lerp(ANG[i], ANG[i + 1], f - i);
};
const tiltAt = (f: number) => lerp(ORRERY_TILT0, 1, smootherstep(prog(f, T.tilt)));
const planetRAt = (f: number) => lerp(EARTH_R0, CENTRE_D, smootherstep(prog(f, T.planetIn)));
/** a point on the (tilted) orbit plane at radius r, screen angle a */
const onPlane = (r: number, a: number, s: number): P2 => [SUN[0] + r * Math.cos(a), SUN[1] + r * s * Math.sin(a)];
const planetPosAt = (f: number): P2 => onPlane(planetRAt(f), angAt(f), tiltAt(f));
/** the rod's lean (body rotation of the planet gear): the rod's top rides the vertical through SUN */
const chiOf = (p: P2) => Math.asin((SUN[0] - p[0]) / ROD_LEN);

// The sun gear: still until the planet's teeth touch, then driven; during the engagement window the drive
// ramps in while the teeth sink into mesh; from T.engage[1] the exact rolling relation (as V1).
const F_RAW = (f: number) => 2 * (angAt(f) - ORBIT_W) - chiOf(planetPosAt(f));
const PHI_S = (() => {
  const out = new Float64Array(LAST + 1);
  const e1 = T.engage[1];
  out[e1] = PHI_S_END + F_RAW(e1) - F_RAW(LAST);
  for (let f = e1 + 1; f <= LAST; f++) out[f] = PHI_S_END + F_RAW(f) - F_RAW(LAST);
  for (let f = e1; f > 0; f--) {
    const w = smoothstep((f - 0.5 - T.engage[0]) / (T.engage[1] - T.engage[0]));
    out[f - 1] = out[f] - w * (F_RAW(f) - F_RAW(f - 1));
  }
  return out;
})();
const phiSunAt = (f: number) => {
  if (f >= T.engage[1]) return PHI_S_END + F_RAW(f) - F_RAW(LAST);
  if (f <= 0) return PHI_S[0];
  const i = Math.floor(f);
  return lerp(PHI_S[i], PHI_S[i + 1], f - i);
};
const PLANET_PHASE = PHI_P_END - chiOf(planetPosAt(LAST));

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
    rodTop: [SUN[0], planet[1] - ROD_LEN * Math.cos(chi)],
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA (cut 10). World point (wx, wy) at screen (sx, sy) at zoom k.
// Close on the orrery's Sun and arm -> pull back to the whole instrument (k
// ~0.98 by f100) -> ease in while the Earth traces -> V1's keys from f176 (so
// f176 on, and MACHINE_END_CAM, are exactly V1's).
// ---------------------------------------------------------------------------
const camRaw = makeCamera(
  [
    { f: 0, k: 1.9, wx: SUN[0], wy: SUN[1], sx: 556, sy: 860 },
    { f: 30, k: 1.32, wx: SUN[0], wy: SUN[1], sx: 505, sy: 795 },
    { f: 100, k: 0.98, wx: SUN[0], wy: SUN[1], sx: 540, sy: 735 },
    { f: 150, k: 1.02, wx: SUN[0], wy: SUN[1], sx: 556, sy: 768 },
    { f: 176, k: 1.03, wx: SUN[0], wy: SUN[1], sx: 585, sy: 790 },
    { f: 200, k: 1.13, wx: SUN[0], wy: SUN[1], sx: 540, sy: 900 },
    { f: 260, k: 1.16, wx: SUN[0], wy: SUN[1], sx: 540, sy: 902 },
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
const EARTH_BALL_R = 26;
const SUN_BALL_R = 50;
const ARM_DROP = 175; // the arm runs this far below the orbit plane on the orrery
const MOON_R = 46; // the Moon's arm
const ROD_DROP = 1150; // the rod's strap starts its descent this far above the hub (off frame)

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
  const traceOn = f > T.traceFrom;
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
    traceA0: angAt(T.traceFrom),
    rimR: RIM_R,
    rimTilt,
    rimW,
    rimColor: mixColor(ACCENT, RIM_INK, smoothstep(prog(f, [T.rimThick[0] + 4, T.rimThick[1]]))),
    rimGroove: smoothstep(prog(f, [162, 176])),
    // the Earth -> planet
    planetR: lerp(EARTH_BALL_R, ROOT_R, pg),
    planetTooth: (TIP_R - ROOT_R) * pt,
    planetDetail: smoothstep(prog(f, [168, 178])),
    armDrop: ARM_DROP * (1 - smootherstep(prog(f, T.armRise))),
    armW: lerp(13, 1.7, armFade),
    armColor: mixColor(ACCENT, INK, armFade),
    armOpacity: lerp(1, 0.72, armFade),
    moonR: MOON_R * (1 - smootherstep(prog(f, T.moonIn))),
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
    rodOffset: f < T.rodDescend[0] ? null : ROD_DROP * (1 - smoothstep(prog(f, T.rodDescend))),
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
  const ry = DRUM_RX0 * ORRERY_TILT0 * (1 - m); // the drum's elliptical faces flatten into the block's edges
  const legTopY = bBot + ry * 0.5; // the legs (the baluster) leave from under the drum
  const legX = (inner: boolean, sgn: number, y: number) => {
    const u = (y - legTopY) / (ft - legTopY);
    const top = inner ? lerp(-4, 62, m) : lerp(30, 128, m);
    const bot = inner ? lerp(-4, 300, m) : lerp(50, 370, m);
    return cx + sgn * (top + (bot - top) * u);
  };
  const line = { fill: PED_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };
  const leg = (sgn: number) =>
    `M${fx(legX(true, sgn, legTopY))} ${fx(legTopY)}L${fx(legX(false, sgn, legTopY))} ${fx(legTopY)}L${fx(legX(false, sgn, ft))} ${fx(ft)}L${fx(legX(true, sgn, ft))} ${fx(ft)}Z`;
  const tieY0 = sy + 590;
  const tieY1 = sy + 628;
  const tieGap = legX(true, 1, tieY0) - legX(true, -1, tieY0);
  const tie = `M${fx(legX(true, -1, tieY0) - 6)} ${fx(tieY0)}L${fx(legX(true, 1, tieY0) + 6)} ${fx(tieY0)}L${fx(legX(true, 1, tieY1) + 6)} ${fx(tieY1)}L${fx(legX(true, -1, tieY1) - 6)} ${fx(tieY1)}Z`;
  const rib = (sgn: number) => `M${fx((legX(true, sgn, legTopY + 30) + legX(false, sgn, legTopY + 30)) / 2)} ${fx(legTopY + 30)}L${fx((legX(true, sgn, ft - 20) + legX(false, sgn, ft - 20)) / 2)} ${fx(ft - 20)}`;
  // the drum / block: a box with an elliptical bottom edge and top face (flat at m = 1)
  const boxD =
    ry > 0.05
      ? `M${fx(cx - bx)} ${fx(bTop)}L${fx(cx + bx)} ${fx(bTop)}L${fx(cx + bx)} ${fx(bBot)}A${fx(bx)} ${fx(ry)} 0 0 1 ${fx(cx - bx)} ${fx(bBot)}Z`
      : `M${fx(cx - 214)} ${fx(sy - 34)}L${fx(cx + 214)} ${fx(sy - 34)}L${fx(cx + 214)} ${fx(sy + 64)}L${fx(cx - 214)} ${fx(sy + 64)}Z`;
  const capH = 38 * smoothstep((m - 0.5) / 0.5);
  const turned = (1 - m) * (1 - m);
  const colY = (u: number) => lerp(legTopY, ft, u);
  const colHalf = (u: number) => lerp(30, 50, u) * (1 - m) + 1;
  const boxClip = `${idPrefix}-box`;
  return (
    <g transform={`translate(0 ${fx(dy)})`}>
      <defs>
        <clipPath id={boxClip}>
          <path d={boxD} />
        </clipPath>
      </defs>
      {m < 1 && tieGap > -12 ? <path d={tie} {...line} /> : null}
      <path d={leg(-1)} {...line} />
      <path d={leg(1)} {...line} />
      <path d={rib(-1)} stroke={SPOKE_INK} strokeOpacity={0.45} strokeWidth={1.4} fill="none" />
      <path d={rib(1)} stroke={SPOKE_INK} strokeOpacity={0.45} strokeWidth={1.4} fill="none" />
      {/* the baluster's turned collars (they go as it parts into legs) */}
      {turned > 0.01
        ? [0.06, 0.42, 0.9].map((u, i) => (
            <ellipse key={i} cx={cx} cy={colY(u)} rx={colHalf(u) + 10} ry={(colHalf(u) + 10) * ORRERY_TILT0} fill={PED_FILL} stroke={SPOKE_INK} strokeWidth={3.2} opacity={turned} />
          ))
        : null}
      {m >= 1 ? <path d={tie} {...line} /> : null}
      {/* the foot: a wide flat base with a plinth step */}
      <path d={`M${cx - 400} ${fx(ft)}L${cx + 400} ${fx(ft)}L${cx + 400} ${fx(ft + 20)}L${cx + 460} ${fx(ft + 20)}L${cx + 460} ${fx(footY)}L${cx - 460} ${fx(footY)}L${cx - 460} ${fx(ft + 20)}L${cx - 400} ${fx(ft + 20)}Z`} {...line} />
      {/* the drum (the orrery's gear box) -> the bearing block on the shaft, its cap and two bolts */}
      <path d={boxD} {...line} />
      <BoxHatch x0={cx - bx} y0={bTop} x1={cx + bx} y1={bBot + ry} clip={boxClip} opacity={0.35 * (1 - m)} />
      {ry > 0.05 ? (
        <>
          <ellipse cx={cx} cy={bTop} rx={bx} ry={ry} fill={PED_FACE} stroke={SPOKE_INK} strokeWidth={3.2} />
          <ellipse cx={cx} cy={bTop} rx={bx * 0.78} ry={ry * 0.78} fill="none" stroke={SPOKE_INK} strokeOpacity={0.55 * (1 - m)} strokeWidth={1.6} />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * 2 * Math.PI;
            return (
              <path
                key={i}
                d={`M${fx(cx + bx * 0.78 * Math.cos(a))} ${fx(bTop + ry * 0.78 * Math.sin(a))}L${fx(cx + bx * 0.86 * Math.cos(a))} ${fx(bTop + ry * 0.86 * Math.sin(a))}`}
                stroke={SPOKE_INK}
                strokeOpacity={0.55 * (1 - m)}
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
  const sunROut = lerp(86, TIP_R, h);
  const sunD = gearD(SUN, ph.phiS, sunRIn, sunROut, lerp(2.2, TOOTH_HW_IN, h), lerp(0.7, TOOTH_HW_OUT, h));
  const shortRayOut = 66;

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

  // the connecting rod (as V1): a full-length cream bar on the line up to the beam end; its strap comes down
  let rod: React.ReactNode = null;
  if (s.rodOffset !== null) {
    const ux = Math.sin(ph.chi);
    const uy = -Math.cos(ph.chi);
    const o = s.rodOffset;
    const L = o + 2400;
    const hw = 14;
    const q = (t: number, w: number): string => `${fx(p[0] + ux * t - uy * w)} ${fx(p[1] + uy * t + ux * w)}`;
    const e: P2 = [p[0] + ux * o, p[1] + uy * o];
    rod = (
      <g>
        <path d={`M${q(o, -hw)}L${q(L, -hw)}L${q(L, hw)}L${q(o, hw)}Z`} fill={INK} stroke={DARK} strokeWidth={3.4} strokeLinejoin="round" paintOrder="stroke" />
        <path d={`M${q(o + 46, 5.5)}L${q(L, 5.5)}`} stroke={DARK} strokeOpacity={0.4} strokeWidth={1.4} />
        <path d={`M${q(o + 14, -20)}L${q(o + 44, -20)}L${q(o + 44, 20)}L${q(o + 14, 20)}Z`} fill={INK} stroke={DARK} strokeWidth={3.2} strokeLinejoin="round" paintOrder="stroke" />
        <path d={`M${q(o + 36, -20)}L${q(o + 36, 20)}`} stroke={DARK} strokeOpacity={0.5} strokeWidth={1.4} />
        <circle cx={e[0]} cy={e[1]} r={30} fill={INK} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
        <circle cx={e[0]} cy={e[1]} r={13} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={1.4} />
        <circle cx={e[0]} cy={e[1]} r={8} fill={DARK} />
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

      {pedestal ? <Pedestal dy={s.pedestalDy} footY={footY} morph={m} idPrefix={`${idPrefix}-ped`} /> : null}
      {pillar}
      {!near ? arm : null}
      {!near ? earthGroup : null}
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

      {near ? arm : null}

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

      {near ? earthGroup : null}

      {rod}
    </WorldSvg>
  );
};

/** the settled machine (frames >= T.settled), turning: what cut 42 continues */
export const SunAndPlanetMachine: React.FC<{ frame: number; cam: Cam; idPrefix?: string; pedestal?: boolean; footY?: number }> = ({ frame, cam, idPrefix, pedestal, footY }) => (
  <OrbitScene frame={Math.max(frame, T.settled)} cam={cam} idPrefix={idPrefix} pedestal={pedestal} footY={footY} />
);
