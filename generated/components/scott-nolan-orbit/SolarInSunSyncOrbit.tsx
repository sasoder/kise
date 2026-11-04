// ---------------------------------------------------------------------------
// SolarInSunSyncOrbit (scott-nolan-orbit, cut 24). Cheeky Pint style (stout) in real 3D (nuclearWorld + energyWorld,
// the sister clips' board), rising into space (marsOceanShared's LitGlobe). Opaque 1080x1920, 23.976 fps, 98 frames.
// RENDER WITH --gl=angle.
//
// CHECK LINE: "his real rival to nuclear isn't solar-plus-batteries on the ground, it's solar panels put up in orbit,
// where they sit in sunlight all the time."
//
// THE LINE: "[the] competitor for nuclear is actually pure solar. Solar in sun-sync orbit, [if we're talking data centers]"
// WORD -> FRAME: (the -7) · competitor 3 · for 9 · nuclear 16 · is 28 · actually 36 · pure 42 · solar 48 · Solar 57 ·
// and/in 69 · sun 74 · sync 77 · orbit 83 · (if 91, after the slot)
// DURATION: the slot 24.524 -> 28.612 s = 4.088 s x 23.976 = 98 frames (f0..f97).
//
// THE MOTION: one continuous rise. It opens CLOSE on NUCLEAR (rev 1), the subject: sharp, its core toned to cream (amber
// is the sun's power here), steam rising out of the cooling tower, a slow push in; SOLAR waits off frame to the right.
// On "is actually pure" one eased pan (f25-44) carries the camera right onto SOLAR while the focus racks from nuclear to
// solar (a screen-space depth of field: the out-of-focus side blurred, f27-45); NUCLEAR softens, dims and leaves by the
// left edge. SOLAR is sharp and centred, its label readable, on "solar" (f48). Its panel array then lifts off the plinth,
// whole (the plinth stays, the legs fold up, a small bus comes up out of the plinth under it), and SOLAR's label sinks
// into the board (f47-53). The camera cranes up WITH the array in one eased rise (f47-84), tilting from looking down to
// looking slightly up: the board drops away into a warm haze, the sky darkens to espresso space, and on the way up the
// four rows (thickening into solid panels) re-fold into two wings either side of the bus. The tilt brings the sun down
// into frame at the upper left
// (f71-86); an amber front sweeps the cells from the sun's side (f64-77). The whole Earth rises in under the satellite
// (f70-81), lit from the side: day on the left, a brown night on the right ~40 % of the disc top to bottom. The orbit
// ring (dawn-dusk: in the day/night line's plane) draws out of the satellite both ways (f73-90) into a closed loop that
// runs just outside the line and clears the limb at the top (the satellite) and the bottom. Resolved by ~f88; alive to
// the last frame (Earth spinning under the fixed day/night line, a slow push-in, the panels' glint).
// AMBER = THE SUN'S POWER: the sun and the satellite's cells in full sun. The nuclear core is cream. No text in orbit.
// CAUSE: the amber front starts on the sun's side as the satellite clears the haze (first amber f65).
// HONEST CHEATS: the satellite is drawn hugely oversized against Earth (its wings wider than the globe) and the ring
//   0.16 Earth radii up (a 600-800 km orbit is ~0.1); the craft is turned 38 deg toward the camera about the radial so
//   its cells face us (they face the sun's side, not exactly the sun); the sun is placed in frame upper left as a marker
//   while Earth is lit from 12 deg toward the viewer; the orbit's ~98 deg inclination is not drawn (no poles marked).
//
// SOURCES (FACT_CHECK.md, section 3): ESA "Types of orbits": SSO usually 600-800 km; ESA "Polar and Sun-synchronous
// orbit": dawn-dusk SSO satellites ride the sunrise/sunset line and are never shadowed by Earth (near-constant
// sunlight). No figures on screen. Earth texture: marsOceanShared MVO_TEX.earth (Solar System Scope daymap).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { ATMO, LitGlobe, MVO_TEX, NIGHT, WATER } from "../kits/cheeky-pint/marsOceanShared";
import { NuclearStage, SoftShadows, nuclearCamAt, nuclearEye, nuclearMaterial, nuclearProject, nuclearTrack, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { LINEUP, Lineup, NUCLEAR, PLINTH, PlantLabels, Smoke, labelShadowItems } from "../scott-nolan-wind/energyWorld";
import {
  ARRAY_HOME,
  OrbitRing,
  SatCanvas,
  SkyDome,
  SolarArray,
  ease,
  globeCentre,
  liftedCaps,
  mixHex,
  orbitAxes,
  satAttitude,
  type Orbit,
  type SkyLook,
} from "./orbitWorld";
// three ships without types here
// @ts-expect-error untyped module
import * as THREE from "three";

export const FPS = 24000 / 1001;
export const DURATION = 98;
export const schema = z.object({});
export const defaultProps = schema.parse({});
// ---------------------------------------------------------------------------
// CAMERA: the house damped follower (nuclearTrack). Close on nuclear; the pan onto solar; the crane (ty with the array,
// pitch 17 -> -10, push in); a slow creep to the end. The array's height is the crane's height (it rises WITH it).
// ---------------------------------------------------------------------------
const TY_LIFTED = ARRAY_HOME[1] + 45;
export const LIFT = 45;
export const CRANE = 900;
export const START: NuclearCam = { tx: 0, ty: TY_LIFTED, tz: 0, d: 880, yaw: 0, pitch: 10, f: 2200, cy: 600, cx: 540 };
export const TRACK = nuclearTrack(
  START,
  [
    // "the competitor for nuclear": close on NUCLEAR, a slow push in with a drift toward where we are going
    { f0: -30, f1: 34, to: { d: 840, tx: 16 } },
    // "is actually pure solar": one eased pan right onto SOLAR; NUCLEAR leaves by the left edge (no slice parked there)
    { f0: 25, f1: 44, to: { tx: 428, tz: -ARRAY_HOME[2], d: 1120, pitch: 12, cy: 660 } },
    { f0: 47, f1: 84, to: { ty: TY_LIFTED + CRANE, pitch: -10, d: 1040, cy: 730 } },
    { f0: 84, f1: 140, to: { d: 995 } },
  ],
  DURATION,
);
const camAt = (f: number) => nuclearCamAt(TRACK, f);

// ---------------------------------------------------------------------------
// THE ORBIT (screen space): the sun 12 deg round from the left toward the viewer, so Earth is lit from the side and its
// night is the right ~40 % of the disc along its whole height; the whole globe (radius 500 px) sits under the satellite;
// the ring (the satellite's altitude, 1.16 radii, in the terminator's plane: dawn-dusk) runs just outside the
// day/night line and clears the limb at the top (where the satellite rides) and at the bottom.
// ---------------------------------------------------------------------------
export const ORBIT: Orbit = { a: 12, R: 500, ring: 1.16 };
export const SAT_S = 0;
/** honest cheat: the craft is turned 38 deg toward the camera about the radial so its cells face us (~40 deg off the
 *  view) rather than edge-on; its panels face the sun's side, not exactly the sun */
const SAT_YAW = 38;
const SAT_ROLL = 0;
const AX = orbitAxes(ORBIT);
const SAT_Q = satAttitude(ORBIT, camAt(DURATION - 1).pitch, SAT_S, SAT_YAW, SAT_ROLL);
const QI = new THREE.Quaternion();
/** the ring draws out of the satellite in both directions as it settles, closing into the full loop by f90 */
const RING_IN = { f0: 73, f1: 90 };
/** Earth rises in from below, f70-81 (after the board has left the frame), decelerating into place */
const GLOBE_IN = { f0: 70, f1: 81, from: 1350 };
const ramped = (f: number, f0: number, w: number, ramp = 6) => {
  const t = Math.max(0, f - f0);
  return w * (t - ramp * (1 - Math.exp(-t / ramp)));
};
/** Earth spins on its own axis under the fixed day/night line (land moves left to right, from day into evening) */
const EARTH = { lon: 22, lat: 9, f0: 60, w: 0.3 };
/** the sun: a fixed direction in the world (world X right, Y up, Z away), so the crane's tilt brings it down into frame */
const SUN_DIR = (() => {
  const az = (-9 * Math.PI) / 180;
  const el = (21 * Math.PI) / 180;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)] as const;
})();

/** the air on the way up: the board's espresso -> a warm haze the board falls into (f46-60) -> clearing to space */
export const HAZE = "#7C5E47";
export const SPACE = { hor: "#3B281C", mid: SKY.top, top: "#2E1F16" } as const;
const skyLookAt = (f: number): SkyLook => {
  const up = ease(f, 60, 76);
  return {
    hor: mixHex(mixHex(COLOR.ground, HAZE, ease(f, 50, 61)), SPACE.hor, up),
    mid: mixHex(COLOR.ground, SPACE.mid, ease(f, 52, 76)),
    top: mixHex(COLOR.ground, SPACE.top, ease(f, 52, 80)),
    band: 0.42 - 0.12 * ease(f, 56, 80),
  };
};
/** the sea's night side: the petrol's darkest taken toward NIGHT brown, so night reads as one warm dark over land and sea */
const OCEAN_NIGHT = mixHex(WATER.darkest, NIGHT, 0.85);

/** the sun: a soft hot disc (amberHot core, cream heart) in a wide warm glow, stout's palette; no flare */
const SunGlow: React.FC<{ x: number; y: number; a: number }> = ({ x, y, a }) => {
  const at = `at ${x.toFixed(1)}px ${y.toFixed(1)}px`;
  const k = (v: number) => (v * a).toFixed(3);
  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(circle 46px ${at}, rgba(255,246,226,${k(1)}) 0px, rgba(255,231,168,${k(1)}) 30px, rgba(255,231,168,${k(0.9)}) 40px, rgba(255,231,168,0) 47px)`,
          `radial-gradient(circle 190px ${at}, rgba(255,231,168,${k(0.55)}) 0px, rgba(255,176,0,${k(0.16)}) 120px, rgba(255,176,0,0) 190px)`,
          `radial-gradient(circle 760px ${at}, rgba(251,233,196,${k(0.26)}) 0px, rgba(251,233,196,${k(0.08)}) 380px, rgba(251,233,196,0) 760px)`,
        ].join(", "),
      }}
    />
  );
};

/** RACK FOCUS (a lens's depth of field, done honestly in screen space): the frame splits at the midpoint between the two
 *  plants; the side not in focus is blurred (a backdrop blur over the board), crossfading over a soft seam. Focus is on
 *  NUCLEAR to f27, pulls to SOLAR with the pan, and is fully on SOLAR by f45. */
export const FOCUS = { f0: 27, f1: 45, blur: 9, seam: 150 } as const;
const FocusBlur: React.FC<{ mid: number; left: number; right: number }> = ({ mid, left, right }) => {
  const a = (mid - FOCUS.seam).toFixed(1);
  const b = (mid + FOCUS.seam).toFixed(1);
  const side = (px: number, grad: string) =>
    px > 0.05 ? (
      <AbsoluteFill style={{ backdropFilter: `blur(${px.toFixed(2)}px)`, WebkitBackdropFilter: `blur(${px.toFixed(2)}px)`, maskImage: grad, WebkitMaskImage: grad }} />
    ) : null;
  return (
    <>
      {side(left, `linear-gradient(to right, #000 ${a}px, transparent ${b}px)`)}
      {side(right, `linear-gradient(to right, transparent ${a}px, #000 ${b}px)`)}
    </>
  );
};
/** the cooling tower's steam: the kit's gas haze (pale cream) made big and slow, rising nearly straight up */
const STEAM = { life: 80, n: 24, r0: 24, grow: 2.2, rise: 2.1, wind: [0.2, 0.06] as [number, number], alpha: 0.4 };
const STEAM_AT: [number, number, number] = [LINEUP.nuclear[0] + NUCLEAR.TOWER.x, PLINTH.H + NUCLEAR.TOWER.h - 6, LINEUP.nuclear[1] + NUCLEAR.TOWER.z];

const rgbOf = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

const SolarInSunSyncOrbit: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const S = 10 + f;
  // fog: the sisters' (ground colour, 1.6-6 d) -> the sky's horizon colour, closing in as the board falls away
  // (raw sRGB values like the kit's own uniforms: no colour management)
  const sky = skyLookAt(f);
  nuclearMaterial("clay").uniforms.uFogCol.value.set(...rgbOf(sky.hor));
  const fh = ease(f, 50, 64);
  const fog: [number, number] = [1.6 - 0.35 * fh, 6 - 3.6 * fh];

  // the array: lift, crane, fold, turn, amber
  const lift = LIFT * ease(f, 47, 57);
  const crane = Math.max(0, cam.ty - TY_LIFTED);
  const at: [number, number, number] = [ARRAY_HOME[0], ARRAY_HOME[1] + lift + crane, ARRAY_HOME[2]];
  const q = new THREE.Quaternion().slerpQuaternions(QI, SAT_Q, ease(f, 52, 75));
  const pose = {
    at,
    q,
    fold: ease(f, 53, 73),
    legs: ease(f, 48, 57),
    bus: 0.4 * ease(f, 48, 57) + 0.6 * ease(f, 58, 71),
    front: -1.7 + 3.4 * ease(f, 64, 77),
    glint: -0.4 + ((S / 110) % 1) * 1.9,
    flight: ease(f, 50, 60),
  };

  // the orbit picture: the globe's centre from the satellite's screen point; it rises in from below
  const satScr = nuclearProject(cam, [at[0], at[1], -at[2]]);
  const gc = globeCentre(ORBIT, satScr, SAT_S);
  const gt = Math.max(0, Math.min(1, (f - GLOBE_IN.f0) / (GLOBE_IN.f1 - GLOBE_IN.f0)));
  const rise = GLOBE_IN.from * Math.pow(1 - gt, 3);
  const centre = { x: gc.x, y: gc.y + rise };
  const g = { lon: EARTH.lon - ramped(f, EARTH.f0, EARTH.w), lat: EARTH.lat, roll: 0 };
  // the ring is drawn on the settled globe (it is where it is whether or not Earth has risen into frame yet)
  const ringExt = Math.PI * ease(f, RING_IN.f0, RING_IN.f1);
  // the sun: projected from its fixed direction; the air between thins as we climb
  const eye = nuclearEye(cam);
  const sun = nuclearProject(cam, [eye[0] + SUN_DIR[0] * 1e5, eye[1] + SUN_DIR[1] * 1e5, eye[2] + SUN_DIR[2] * 1e5]);
  const sunA = 0.35 + 0.65 * ease(f, 56, 78);
  // SOLAR's label recedes as its array leaves: toned to the board and sunk down through it by f50, before the crane takes
  // it into the caption bands; its contact shadow goes with it
  const solarRecede = ease(f, 47, 53);
  // the rack focus: from NUCLEAR to SOLAR with the pan
  const focus = ease(f, FOCUS.f0, FOCUS.f1);
  const nucScr = nuclearProject(cam, [LINEUP.nuclear[0], 120, LINEUP.nuclear[1]]);
  const solScr = nuclearProject(cam, [LINEUP.solar[0], 60, LINEUP.solar[1]]);
  const blurNuc = FOCUS.blur * focus;
  const blurSol = FOCUS.blur * (1 - focus);
  const nucDim = 0.6 * ease(f, 30, 44);
  const labelShadow = (["nuclear", "solar"] as const).flatMap((k) => labelShadowItems(k, 0.32 * (k === "solar" ? 1 - solarRecede : 1)));

  return (
    <NuclearStage
      cam={cam}
      S={S}
      boardUnits={1000}
      fog={fog}
      pool={{ x: 520, y: 860, strength: 0.95 * (1 - 0.75 * ease(f, 64, 82)) }}
      world={
        <>
          <SkyDome cam={cam} look={sky} />
          <Lineup S={S} only={["nuclear", "solar"]} core="cream" dim={{ nuclear: nucDim }} bare={{ solar: true }} occ={{ solar: liftedCaps(lift + crane) }} />
          {/* SOLAR recedes into the board as its array leaves, so no label crosses the caption bands on the crane */}
          {f < 60 ? <Smoke at={STEAM_AT} S={S} kind="gas" amount={1.2} seed={5} look={STEAM} /> : null}
          <SoftShadows items={labelShadow} />
          <PlantLabels only={["nuclear", "solar"]} shadow={false} dim={{ nuclear: nucDim, solar: solarRecede }} sink={{ solar: solarRecede }} />
        </>
      }
      overlay={
        <AbsoluteFill>
          {/* the rack focus over the board (the array's own canvas is blurred with it below) */}
          <FocusBlur mid={(nucScr.x + solScr.x) / 2} left={blurNuc} right={blurSol} />
          {/* the sun: a soft hot disc in its own glow, upper left; it comes down into frame as the crane tilts up */}
          <SunGlow x={sun.x} y={sun.y} a={sunA} />
          <LitGlobe
            texture={MVO_TEX.earth}
            cx={centre.x}
            cy={centre.y}
            r={ORBIT.R}
            lon={g.lon}
            lat={g.lat}
            roll={g.roll}
            light={AX.sun}
            atmosphere={{ ...ATMO.earth, strength: 0.35 }}
            ocean={{ mask: MVO_TEX.earthOcean, reveal: 0, time: f, lit: WATER.surface, dark: OCEAN_NIGHT, deep: OCEAN_NIGHT, basin: 0 }}
            grade={{ exposure: 1.05, sat: 0.8, warm: 0.08, ambient: 0.006, limb: 0.12, highlight: 2.4, terminator: [0.02, 0.16] }}
          />
          <OrbitRing o={ORBIT} centre={gc} ext={ringExt} s={SAT_S} />
          <AbsoluteFill style={blurSol > 0.05 ? { filter: `blur(${blurSol.toFixed(2)}px)` } : undefined}>
            <SatCanvas cam={cam} id="solarSatBloom">
              <SolarArray pose={pose} />
            </SatCanvas>
          </AbsoluteFill>
        </AbsoluteFill>
      }
    />
  );
};

export default SolarInSunSyncOrbit;

/** probe values for the header and the checks */
export const probe = (f: number) => {
  const cam = camAt(f);
  return { cam, sat: nuclearProject(cam, [ARRAY_HOME[0], ARRAY_HOME[1] + LIFT * ease(f, 47, 57) + Math.max(0, cam.ty - TY_LIFTED), -ARRAY_HOME[2]]) };
};
