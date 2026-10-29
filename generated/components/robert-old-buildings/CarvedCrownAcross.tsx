// ---------------------------------------------------------------------------
// CarvedCrownAcross (robert-old-buildings, cut 31, brief 32). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 102 frames. The world is the clip's shared streetWorld.tsx (read-only; built by cut 26
// FifteenthFloor): a pre-war Manhattan side street in three.js inside the kit's AirStage (palette A, mood day).
//
// CHECK LINE: "Right across from his window, at his height, the top of the building opposite is covered in carved stone."
//
// THE LINE: "(Across the street) is a building that's 15 stories or 16 stories high."
// WORD -> FRAME (Whisper, from the comp start at 31.907 s): a 2 · building 4 · that's 15 · 15 29 · stories 36 · or 49 ·
// 16 62 · stories 71 · high 81 · (cut to the real photo of rooftop carving at 102; "And" 99).
// DURATION: the slot 31.907 -> 36.161 s = 4.254 s x 23.976 = 102 frames (f0..f101), sequence frames 765 -> 867.
//
// THE MOTION: one continuous eased move. f0 we stand at his 15th-floor window, eye in the lower pane (a curtain soft at
// the left, the jamb, the meeting rail framing the top, the lamp-lit stool and the radiator's top low in the frame),
// looking across at an angle at the building opposite, its carved crown near our eye level. Already moving, the camera
// eases out through the lower pane (the rail leaves off the top by f5, the sill passes under, out over the street by
// f12) and keeps going over the street: swinging to a slight three-quarter, tilting up and pushing in, while a wide,
// soft band of warm cream light (streetWorld `sweep`: col #F3DDB4, amt 0.5, w 2.8 = about 1.5 storeys at half height,
// the panes' glint kept faint at 0.4) drifts up
// the facade from the street (f0) to floor 15 on "stories" (f36) and into the attic storey on "16" (f62), the attic
// sliding into the frame's top on the approach: the height is counted by eye, no numbers. It lands by "high" (f81)
// 7 m off the crown, 20 deg off its normal (the facade receding to the left), the eye at floor 15's height looking a
// little up: the crest cartouche and its scrolls against the air ~y 230-450, the hooded dormers above the deep
// cornice (streetWorld rev 4: it hides the mansard's foot from below, as the real one does), the floor-15 consoles,
// garlands and frieze in its shadow, the carving ending ~y 1035 (the horizon is y 1077, so every carved part, all of
// it above the eye, stays above the 1080 caption band), the plain storeys below dissolving into the low air. The
// carving reads as stone in late sun: glow 0 -> 0.5 (f58-82) with streetWorld rev 4's glowRim {lo 0.3, hi 0.95,
// max 0.55, warm 2.5}: a warmer stone body and a narrow, soft hint of orange on the relief's edges, never drawn lines
// (the cut goes straight to a real stone photo). f81-101: a living hold
// (the dolly creeps on at ~1 cm a frame, the band creeps up through the cresting, the shafts and motes drift) for the
// cut to the photo.
// Orange = hand-carved stonework (the clip's one rule): only the crown's relief via streetWorld's `glow`; his lamp is
// warm cream; the light band is cream. No figures, no text.
//
// DEPTH: streetWorld's metres (X along the street, Y up, Z across; his facade z = 0, the building across z = 18, its
// cresting set back to z ~20). Camera START {x 1.1, y 47.6, z -0.65, yaw 168, pitch -12, f 620} (in his room, eye in
// the lower pane) -> LAND {x 1.05 - 7 tan 20deg, y 46.8, z 11, yaw 160, pitch 7.5, f 890}. Position and focal ride one
// progress U (integrated from a velocity profile: already moving at f0, gathering f12-30, a cruise ~24 cm a frame
// f30-42, eased out f40-84, then a creep); yaw, pitch, eye height and the side step ride a slightly later lobe UT.
// LOW AIR: as the camera closes on the crown, a veil in the stage's own air colour (by screen row) on a long height
// ramp: zero two storeys under the consoles' foot, easing in to full only at the frame's bottom edge (no edge, no
// water line); its strength tied to the camera's distance across (z 5 -> 10.2), so the storeys are counted in the
// clear and dissolve into the street's dense air on the landing.
// Fog: streetWorld's own (per fragment by distance and height).
//
// SOURCES: the crown is streetWorld's, modelled on the Dorilton (171 W 71st St, Janes & Leo, 1900-02) and a NYC stone
// cornice (images/reference_carving/02, 03, 04; Wikimedia Commons, see README.txt there). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirGradient, pchip } from "../kits/dwarkesh-3d/dwarkesh3d";
import { ACROSS, STOREY, StreetStage, streetAirView, streetProject, type StreetCam } from "./streetWorld";

export const FPS = 24000 / 1001;
export const DURATION = 102;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** a progress 0..1 integrated from a velocity profile, sampled finely once (full precision, no stepping) */
const profile = (vel: (f: number) => number, F: number) => {
  const N = 4000;
  const cum = [0];
  let prev = vel(0);
  for (let i = 1; i <= N; i++) {
    const v = vel((F * i) / N);
    cum.push(cum[i - 1] + (prev + v) / 2);
    prev = v;
  }
  const tot = cum[N];
  return (f: number) => {
    const x = (Math.max(0, Math.min(F, f)) / F) * N;
    const i = Math.min(N - 1, Math.floor(x));
    return lerp(cum[i], cum[i + 1], x - i) / tot;
  };
};

// ---- the camera: one move ------------------------------------------------------------------------------------------
export const START: StreetCam = { x: 1.1, y: 47.6, z: -0.65, yaw: 168, pitch: -12, f: 620 };
/** where the move ends at f101 (the landing at f81 is ~97 % of the way; the rest is the hold's creep): 7 m off the
 *  crown, 20 deg off its normal (the facade receding to the left), the eye at floor 15's height looking a little up */
export const LAND: StreetCam = { x: 1.05 - 7 * Math.tan((20 * Math.PI) / 180), y: 46.8, z: 11, yaw: 160, pitch: 7.5, f: 890 };
/** the dolly: already moving at f0, slow through the window, gathering over the street (f14-30), eased out f40-84,
 *  then a creep */
const U = profile((f) => (0.25 + 0.75 * ss(0, 12, f)) * (1 + 1.3 * ss(12, 30, f)) * (1 - 0.95 * ss(40, 84, f)), DURATION - 1);
/** the turn, the tilt, the eye's height and the side step ride a slightly later lobe (they finish in the same lobe) */
const UT = profile((f) => (0.15 + 0.85 * ss(0, 18, f)) * (1 + 0.6 * ss(14, 34, f)) * (1 - 0.95 * ss(42, 86, f)), DURATION - 1);

export const camAt = (f: number): StreetCam => {
  const u = U(f);
  const t = UT(f);
  return {
    x: lerp(START.x, LAND.x, t),
    // the eye drops with the later lobe; it is in the lower pane (47.115 .. 47.955) as it passes the sash (y 47.55)
    y: lerp(START.y, LAND.y, t),
    z: lerp(START.z, LAND.z, u),
    yaw: lerp(START.yaw, LAND.yaw, t),
    pitch: lerp(START.pitch, LAND.pitch, t),
    f: Math.exp(lerp(Math.log(START.f), Math.log(LAND.f), u)),
  };
};
const REST = camAt(0);

const ATTIC_MID = (ACROSS.crown.atticY0 + ACROSS.crown.atticY1) / 2;

// ---- the light band climbing the storeys ---------------------------------------------------------------------------
/** the band's height (m): rising out of the street at f0, floor 15 (46.2) on "stories" f36, the attic storey's middle
 *  on "16" f62, then a slow creep up into the cresting; one monotone decelerating curve (pchip) */
const SWEEP = pchip([
  [0, -3],
  [36, 46.2],
  [62, ATTIC_MID],
  [101, 56.0],
]);
export const sweepY = (f: number) => SWEEP(f);
const SWEEP_AMT = 0.5;
const SWEEP_W = 2.8; // exp(-((y - c) / w)^2): half-height width ~4.7 m, about 1.5 storeys (was 1.7, ~2.8 m)
const GLOW_MAX = 0.5;
/** streetWorld rev 4: a narrower rim with a softer fall-off and a warmer stone body (late sun on stone, not drawn lines) */
const GLOW_RIM = { lo: 0.3, hi: 0.95, max: 0.55, warm: 2.5 };
/** the band's warm cream (streetWorld rev 4 sweep.col) and its pane glints kept subtle (sweep.glint) */
const SWEEP_COL = "#F3DDB4";
const SWEEP_GLINT = 0.4;

// ---- the low air under the crown -----------------------------------------------------------------------------------
/** as the camera closes in under the crown, the plain storeys below it dissolve into the street's dense low air: a veil
 *  in the stage's own air colour (by screen row) on a long, gradual height ramp. It starts (at zero) two storeys under
 *  the consoles' foot (47.0 - 2 x 3.2 = 40.6 m) and eases in (opacity ~ t^1.8) to full strength only at the frame's
 *  bottom edge; the ramp is never shorter than 760 px, so there is no edge or "water line" anywhere. Its strength
 *  rides the camera's distance across (none while the storeys are counted, full on landing). */
const LOWAIR_START = 47.0 - 2 * STOREY;
const LowAir: React.FC<{ cam: StreetCam; frame: number }> = ({ cam, frame }) => {
  const amt = 0.7 * ss(5, 10.2, cam.z);
  if (amt <= 0.001) return null;
  const v = streetAirView(cam, REST, frame);
  const top = Math.max(0, Math.min(1920 - 760, streetProject(cam, [ACROSS.bayX(5), LOWAIR_START, 17.4]).y));
  const stops = [0, 0.2, 0.4, 0.6, 0.8, 1];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <AirGradient id="cca-lowair-c" v={v} y0={top} y1={1920} />
        <linearGradient id="cca-lowair-a" gradientUnits="userSpaceOnUse" x1="0" y1={top.toFixed(2)} x2="0" y2="1920">
          {stops.map((t) => (
            <stop key={t} offset={t} stopColor="#fff" stopOpacity={amt * Math.pow(t, 1.8)} />
          ))}
        </linearGradient>
        <mask id="cca-lowair-m" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
          <rect x="0" y={top.toFixed(2)} width="1080" height={(1920 - top).toFixed(2)} fill="url(#cca-lowair-a)" />
        </mask>
      </defs>
      <rect x="0" y={top.toFixed(2)} width="1080" height={(1920 - top).toFixed(2)} fill="url(#cca-lowair-c)" mask="url(#cca-lowair-m)" />
    </svg>
  );
};

const CarvedCrownAcross: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  // late sun on stone with a hint of orange on the relief's edges, never drawn lines (capped at 0.5: the cut goes
  // straight to a real stone photo)
  const glow = GLOW_MAX * ss(58, 82, frame);
  // the band: warm light drifting up the building, wide and soft (about 1.5 storeys at half height), gentle; softer still in the carving
  const amt = SWEEP_AMT * ss(0, 8, frame) * (1 - 0.25 * ss(40, 62, frame)) * (1 - 0.4 * ss(62, 84, frame));
  return <StreetStage cam={cam} rest={REST} frame={frame} lamp={1} curtain={1} glow={glow} glowRim={GLOW_RIM} bloom={0.2} sweep={{ y: sweepY(frame), w: SWEEP_W, amt, col: SWEEP_COL, glint: SWEEP_GLINT }} front={<LowAir cam={cam} frame={frame} />} />;
};

export default CarvedCrownAcross;
