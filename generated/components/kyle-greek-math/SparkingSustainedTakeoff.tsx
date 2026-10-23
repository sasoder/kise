// ---------------------------------------------------------------------------
// SparkingSustainedTakeoff (kyle-greek-math, cut 15). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 243 frames.
// One stage inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective, from the
// kit kits/dwarkesh-3d/dwarkesh3d. The set: ./sparkTakeoffSet.tsx; the numbers (world, line, stick, camera):
// ./sparkTakeoffPlan.ts.
//
// CHECK LINE: "the Greeks' geometry and science were a real spark: a line drawn in the sand that could have run on and
// lifted into a sustained takeoff."
//
// THE LINE: "[Like the] Greek experiment in math and science is the one that I think had like the better chance of
// sparking sustained takeoff. And [it didn't.]"
// WORD -> FRAME: Greek 1 · experiment 15 · in 34 · math 59 · and 74 · science 80 · is the one that I think 88 ·
// had like the 128 · better 146 · chance of 154 · sparking 172 · sustained 190 · takeoff 200-237 · And 240
// (Whisper onsets ~0.2 s early; "it didn't" is said on camera after the cut).
// DURATION: the slot 15.315 -> 23.423 s = 8.108 s x 29.97 = 243 frames (f0..f242; 702 - 459).
//
// THE MOTION: one material changes shape: the orange groove in the sand. f0 is close on the stick's tip closing the
// last arc of Thales' figure (a circle ~640 px across, the right-angled triangle on its diameter already drawn, the
// groove lighting as the tip passes; closed f34), the camera already pulling back and settling down onto the group:
// the crouched geometer (Thales, greekFolk Scholar 0, ~500 px, head at y ~630-730 from f59 to f172) with his long
// stick at the left, the figure at his right, and behind them his companion beside the armillary sphere, its rings
// still dull bronze. The companion's hand comes onto the ring (contact f68) and pushes it round: the rings turn and
// warm to the glowing orange by f84 ("science" 80). f74-94 the geometer sets his stick on the diameter's end and draws
// one long straight line out of the figure, right and back across the sand (contact f94); at "better" (f146) the
// stroke is past his reach and he lets the line go (the stick lifts f148-162), the line running on by itself.
// f168 ("sparking") a spark ignites at its tip and runs on fast to the knee (f188, "sustained"), where the line lifts
// into ONE smooth exponential hockey stick (no corner: ~20 deg at the knee, ~45, ~70, then steep), DASHED orange from
// the knee up, drawn by the bright moving tip, its climb turning into depth so it rises upright through the right of
// centre and out of the top of the frame (~f231, "takeoff"). The camera lifts the view to follow (the eye rises 1.1 m
// in one lobe f172-252, the horizon shifts down, a pull-back) and settles; the geometer stands (f190-222), plants his
// staff and tilts back to look up at it with his companion. f231-242: settled and living, the Greeks in the
// lower-middle (~315 px, faces y ~700-820), the curve from the right of them to the top edge, motes, the sphere turning.
// The bottom of the frame sinks into the dense low air (LowAirVeil).
// CAUSE BEFORE EFFECT: the groove is drawn only where the stick's tip touches the sand (f0-34 the circle, f94-146 the
// line); the rings turn and light only once the companion's hand is on them (f68); the line runs on by itself only
// after the stick has lifted (f148).
// Orange = Greek mathematical / scientific knowledge (the diagram, the line, the lit rings: solid, glowing); dashed
// orange = the progress that never came (the takeoff). People never orange. No text, no axes, no numbers, no arrowhead.
//
// DEPTH (./sparkTakeoffPlan.ts): a londonDepth one-point perspective driven by an eye (x, height, z), a focal length
// and a vertical lens shift (camKit: dolly 1, so the kit's perspective reproduces the eye exactly); keys -> pchip ->
// the damped follow (SlavesTurnTheCrane's pattern), the eye's height on its own curve. Fog by world depth (fogBy
// "depth"). f0 the eye 3.1 m up, 4.2 m from the figure, F 2600 px; f70-172 the eye 2.7 m up, 5-6 m back, F 2200;
// the end the eye 3.8 m up, 10.4 m back, F 1800, the horizon at y ~430. Depths (Z; the front plane through the
// geometer): the geometer 0, the figure 170 (R 0.52 m), the knee 487, the sphere 700, the companion 735, the stoa's
// colonnade from 700 back at X -4 m. The camera drifts left onto the group while pulling back (f0-70), holds (f70-146),
// then drifts right with the line and the climb (f146-250): one change of direction, through a held stretch.
//
// SOURCES: Thales' theorem (the angle in a semicircle is a right angle; Euclid, Elements III.31; attributed to Thales
// by Diogenes Laertius I.24); armillary spheres in Greek astronomy (Ptolemy, Almagest V.1; Eratosthenes); the stoa as
// the Greek public colonnade. Illustrative, nothing on screen but the figure.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airWorldOf, swayCam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { DURATION as PLAN_DURATION, FPS as PLAN_FPS, camKit, eyeAt } from "./sparkTakeoffPlan";
import { LowAirVeil, SparkWorld } from "./sparkTakeoffSet";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

const REST = (() => {
  const k = camKit(eyeAt(0));
  return { cam: swayCam(k.cam, 0), depth: k.depth };
})();

const SparkingSustainedTakeoff: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const { cam: c0, depth } = camKit(eyeAt(cf));
  const cam = swayCam(c0, cf);
  const A = airWorldOf({ cam, rest: REST.cam, depth, frame, fogBy: "depth" });
  return (
    <AirStage v={A.v} bloom={0.22} front={<LowAirVeil A={A} />}>
      <WorldSvg cam={cam}>
        <SparkWorld A={A} f={frame} />
      </WorldSvg>
    </AirStage>
  );
};

export default SparkingSustainedTakeoff;
