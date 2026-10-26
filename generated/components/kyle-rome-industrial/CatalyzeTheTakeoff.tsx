// ---------------------------------------------------------------------------
// CatalyzeTheTakeoff (kyle-rome-industrial, cut 4). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 131 frames. The world (shared with cut 77) is ./takeoffWorld.tsx; this file is the
// camera. One stage inside the misty teal air (AirStage, palette A) on a pinhole camera that never rotates.
//
// CHECK LINE: "The Industrial Revolution was a sudden, steep climb in how much people could produce — mills, chimneys,
// engines — and Rome, for all its size, sits back on the flat ground long before it."
//
// THE LINE: "[Like,] why didn't the Roman economy catalyze the takeoff? Because in some ways it was [so precocious …]"
// WORD -> FRAME (the brief's Whisper table, heard ~6 frames later): why didn't the -3-23 · Roman economy 23-42 ·
//   catalyze 42-74 · the 74-84 · takeoff? 84-100 · Because in some ways 104-123 · it was 123-133 (runs to the cut)
// DURATION: the slot 4.071 -> 8.442 s = 4.371 s x 29.97 = 131 frames (f0..f130).
//
// THE MOTION (restage 2, director's review Oct 26): one continuous camera that ends looking ACROSS the road of
// history, a little elevated, time running left -> right. f0-42 "why didn't the Roman economy": close on Rome from
// 6.5 m over its basalt street (temple front, red roofs, aqueduct across the middle; in the bottom third the slave
// with his amphora, the freeman and the "AD 100" milestone, legible); the camera already tracks gently right and
// rises, so the near group slides out at the lower left and Rome begins to slide left. f42-84 "catalyze the": an even
// track right and back over the flat: Rome slides to the lower left and shrinks onto its low plateau, the road of
// history runs out across the plain past a few farms; smoke from the far chimneys drifts in out of the haze at the
// top right (~f60), then the beam-engine house (orange beam), the "1800" stone and the first mills come in from the
// right. f84-100 "takeoff?": the tilt lobe (the horizon sinks down the frame) and the track's ease bring the climb
// up into frame: the ground bends at the knee and rears up to the top right, six red-brick mills stepped up it on
// stone terraces (orange-lit windows) with tall chimneys, the four highest trailing soft grey-brown plumes (each its own
// length, width and drift) back over the sky with the wind, the sky staying mostly clear air;
// and a steam locomotive with tender and three wagons climbing the rail at the ramp's edge (orange bands and
// firebox, white steam). f100-130 "Because in some ways it was": settled and living; Rome small at the lower left on
// its plateau, the flat between, the climb with chimneys and smoke filling the right and top.
// The lens shift is DERIVED each frame from Rome's screen path (one glide from (570, 955) to (180, 1530)), so Rome
// never reverses; the climb's foot settles at ~(360, 1690). The haze thins with the eye's height (takeoffWorld).
// Orange = technology only (mill windows, the engine's beam, the locomotive's bands and firebox); Rome has none.
//
// DEPTH: metres. CAM_F0 eye 14.5 m (6.5 m over the plateau), 26 m before Rome's centre, F 900. CAM_END eye 45.8 m,
// at X 104, Z -273 (the knee ~165 m ahead, Rome ~279 m), F 1100. Path: a cubic Bezier in X/Z (PATH_C1, PATH_C2) on
// the track's speed curve (SPEED, flat-topped), height on its own slightly earlier curve (SPEED_H), zoom on the
// track, horizon on TILT (f38-106). Sizes at the end: the lowest mill ~190 px wide, chimneys ~250-330 px tall, the
// train ~330 px long (engine + tender ~150 px), "1800" cap ~38 px, Rome's town ~110 px wide.
//
// SOURCES (illustrative; no figures on screen): the profile's shape follows the long-run picture of GDP per head
// (Maddison Project Database: near-flat for millennia, then the steep rise from c. 1800 in Britain); Rome's plateau
// is drawn only modestly above the flat, after Scheidel & Friesen (2009, JRS 99) on Roman per-capita income
// somewhat above subsistence. Roman milestones: inscribed cylindrical columns on the viae (e.g. the Via Appia's).
// Industrial forms: brick multi-storey textile mills (Arkwright's Cromford Mill, 1771), the beam engine (Newcomen /
// Watt pumping engines), an early locomotive with tender and carriages (Stephenson's Rocket era, 1829-30).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { AirStage, smoothstep } from "../kits/dwarkesh-3d/dwarkesh3d";
import { sway } from "../kits/maps/incaShared";
import { TakeoffWorld, airOf, type TCam } from "./takeoffWorld";

const { fontFamily: cinzel } = loadCinzel("normal", { weights: ["700"], subsets: ["latin"] });

export const FPS = 30000 / 1001;
export const DURATION = 131;
export const schema = z.object({
  /** probe only: a camera as JSON (TCam) to hold */
  probeCam: z.string().default(""),
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

// ---- THE CAMERA: one crane, up and back from the street in front of Rome's temple to the high view down the road ----
/** f0: close on Rome, the eye 1.5 m over the plateau's street, 26 m before the town's centre */
export const CAM_F0: TCam = { X: 1.2, H: 14.5, Z: -26, F: 900, sx: -77, hr: 800 };
/** the resolved view: Rome ~200 px wide low in the frame, the road up to the knee, the ramp of industry above */
export const CAM_END: TCam = { X: 104.13, H: 45.79, Z: -272.61, F: 1100, sx: 31.4, hr: 1384.8 };
/** the TRACK (position, zoom, lens shift sideways): moving from f0, at an even pace through "catalyze the" (f30-84),
 *  easing into "takeoff?" and creeping on to the cut: the integral of a flat-topped speed curve */
const SPEED = (f: number) => 0.1 + 0.9 * smoothstep(12, 50, f) * (1 - smoothstep(88, 120, f));
const P_TRACK = (() => {
  const acc: number[] = [0];
  for (let f = 1; f <= DURATION; f++) acc.push(acc[f - 1] + (SPEED(f - 1) + SPEED(f)) / 2);
  const tot = acc[DURATION - 1];
  return (f: number) => {
    const g = Math.max(0, Math.min(DURATION, f));
    const i = Math.floor(g);
    const v = acc[Math.min(DURATION, i)] + (acc[Math.min(DURATION, i + 1)] - acc[Math.min(DURATION, i)]) * (g - i);
    return v / tot;
  };
})();
/** the TILT (the horizon moving down the frame = looking up the climb): one lobe centred on "takeoff?" */
export const TILT = { a: 38, b: 106 };
/** the path's control point (metres): behind the f0 eye and well left of the knee */
export const PATH_C1 = { X: 62, Z: -32 };
export const PATH_C2 = { X: 18, Z: -250 };
/** the rise runs a little ahead of the track (so the street's near group sinks out of the frame, never up into a band) */
const SPEED_H = (f: number) => 0.12 + 0.88 * smoothstep(0, 34, f) * (1 - smoothstep(86, 120, f));
const P_RISE = (() => {
  const acc: number[] = [0];
  for (let f = 1; f <= DURATION; f++) acc.push(acc[f - 1] + (SPEED_H(f - 1) + SPEED_H(f)) / 2);
  const tot = acc[DURATION - 1];
  return (f: number) => {
    const g = Math.max(0, Math.min(DURATION, f));
    const i = Math.floor(g);
    return (acc[Math.min(DURATION, i)] + (acc[Math.min(DURATION, i + 1)] - acc[Math.min(DURATION, i)]) * (g - i)) / tot;
  };
})();
const P_TILT = (f: number) => {
  const u = smoothstep(TILT.a, TILT.b, f);
  return u;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Rome's centre (the plateau's top under the town) is the anchor: the lens shift is DERIVED each frame so Rome
 *  glides once on screen, from the middle of the frame to the lower left (x on the track's lobe, y on the tilt's:
 *  the horizon moving down the frame = the camera tilting up the climb); everything else moves by parallax */
export const ROME_ANCHOR = { X: 5, h: 8, Z: 6 };
export const ROME_F0: [number, number] = [570, 955];
export const ROME_END: [number, number] = [180, 1530];
/** Rome slides left on screen through these frames (early, so the lens shift never swings the street's near group back in) */
export const ROME_X_SLIDE: [number, number] = [6, 74];
export const camAt = (f: number): TCam => {
  const p = P_TRACK(f);
  const q = P_TILT(f);
  const a = CAM_F0;
  const b = CAM_END;
  const r = P_RISE(f);
  const bz = (u: number, v: number, w: number, x: number) => (1 - p) ** 3 * u + 3 * (1 - p) ** 2 * p * v + 3 * (1 - p) * p * p * w + p ** 3 * x;
  const X = bz(a.X, PATH_C1.X, PATH_C2.X, b.X);
  const Z = bz(a.Z, PATH_C1.Z, PATH_C2.Z, b.Z);
  const H = lerp(a.H, b.H, r);
  const F = lerp(a.F, b.F, p);
  const d = ROME_ANCHOR.Z - Z;
  const tx = lerp(ROME_F0[0], ROME_END[0], smoothstep(ROME_X_SLIDE[0], ROME_X_SLIDE[1], f));
  const ty = lerp(ROME_F0[1], ROME_END[1], q);
  return { X, H, Z, F, sx: tx - 540 - (F * (ROME_ANCHOR.X - X)) / d, hr: ty - (F * (H - ROME_ANCHOR.h)) / d };
};
const withSway = (c: TCam, f: number): TCam => {
  const s = sway(f);
  return { ...c, sx: c.sx + s.dx, hr: c.hr + s.dy };
};

const CatalyzeTheTakeoff: React.FC<z.infer<typeof schema>> = ({ probeCam, camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const c: TCam = probeCam ? { ...CAM_F0, ...JSON.parse(probeCam) } : withSway(camAt(cf), cf);
  const A = airOf(c, frame, CAM_F0);
  return (
    <AirStage v={A.v} bloom={0.25}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
          <TakeoffWorld A={A} frame={frame} font={cinzel} />
        </svg>
      </AbsoluteFill>
    </AirStage>
  );
};

export default CatalyzeTheTakeoff;
