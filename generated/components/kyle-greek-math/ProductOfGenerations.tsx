// ---------------------------------------------------------------------------
// ProductOfGenerations (kyle-greek-math, cut 29). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 229 frames. The world, the camera, the cloud and the glow: ./greekStairWorld.tsx (the
// Stair of Greek mathematics, shared with cuts A and D; contract <notes>/STAIR_READY.md).
//
// CHECK LINE: "Euclid didn't come out of nowhere: he stands on top of a stair built by generations of earlier Greek
// mathematicians, each handing up its piece of geometry."
//
// THE LINE: "[Like Euclid is not just] like a towering genius who comes out of nowhere. He's very much a product of
// the culture and the questions that are being asked in the generations before. [But…]"
// WORD -> FRAME: like 4 · a 7 · towering 10-25 · genius 25-33 · who 33 · comes 46 · out of 54-62 · nowhere 63-69 ·
// He's 71 · very much 75-90 · product 94 · of 102 · the 116 · culture 127-138 · and 138 · the questions 144-155 ·
// that are being asked 155-180 · in the generations 180-197 · before 197-215 · (the speaker resumes "But" at f223)
// DURATION: the slot 29.696 -> 37.337 s = 7.641 s x 29.97 = 1119 - 890 = 229 frames (f0..f228). Cut D
// (NoSustainedProgress, 38.739 s) opens on f228 exactly (greekStairWorld C_END).
//
// THE MOTION (V2, the director's review): ONE continuous pull-back from f0, no hold. f0 close on Euclid alone in the
// light (head, beard, dividers and the Elements filling the frame, his face ~y 500-800); the camera already pulling
// back while the eye sinks from his waist to just over his feet by "towering genius" (f10-45: he looms over a low
// eye, the horizon low, the shafts behind his head); by "nowhere" (f63-69) the whole figure stands on the churning
// fog sea that runs out to the horizon, nothing beneath. The pull-back never stops: its speed rises smoothly into the
// main lobe (peak ~f135) and decelerates once into f205-214. When Eudoxus is wholly in frame (~f117) the fog drains
// down the stair and the eye cranes down with it: the landing with EUCLID, then each generation comes out of it
// whole, top-down (Eudoxus ~f130, Theaetetus ~f140, Hippocrates ~f150, Pythagoras ~f160, Thales ~f170), each holding
// his glowing tablet up toward the step above. On "the questions" (f144) a small light runs up the chain from the
// bottom; each tablet's own lines brighten as it passes (a tight halo, <= 1.3x the tablet), Euclid's scroll the same
// at ~f182, and stays brighter. f205-228 settled and living (exactly V1's end; D opens on f228).
// Orange = Greek mathematical knowledge (the diagrams on the tablets, the Elements); everything else in muted earthy
// local colours (marble cream, umber wood), people never orange. No text but EUCLID carved in the landing's riser.
//
// DEPTH: greekStairWorld's level pinhole camera (StairCam: eye X, height E, depth Zc, focal F, horizon row hy), units
// U = 178 per metre. Risers 1.6 m, treads 1.2 m, 4.6 -> 3.8 m wide; the landing's top 9.6 m up at Z 6.0-9.0 m;
// Euclid at Z 6.5 m. f0: the eye 10.5 m up, 5.9 m in front of Euclid, F 6000 (Euclid ~1770 px); the end: the eye 6 m
// up, 20 m in front of the foot, F 3744 (Euclid ~250 px). The path (C_OPEN) joins V1's at f176 (C2), so f176-228 and
// C_END are V1's exactly. Fog by the eye's distance beyond 27 m (the stair takes none), the air and the low air by
// height, the fog sea (FOG_SEA) and its billows (PUFFS, CHURN).
//
// SOURCES: the diagrams (see greekStairWorld's header): Thales III.31, Pythagoras I.47, Hippocrates' lune, Theaetetus'
// octahedron, Eudoxus' exhaustion (XII.2), Euclid I.1. No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { C_DURATION, C_REST, GreekStairWorld, StairStage, U, cameraC, optsC, stairAirOf, type StairCam } from "./greekStairWorld";

export const FPS = 30000 / 1001;
export const DURATION = 229;
if (DURATION !== C_DURATION) throw new Error("ProductOfGenerations: DURATION != greekStairWorld C_DURATION");
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
  /** probe only: a world viewpoint instead of the cut's camera */
  view: z.enum(["cut", "wide", "landing", "dashed", "diophantus"]).default("cut"),
});
export const defaultProps = schema.parse({});

/** the STAIR_READY probe viewpoints */
const PROBES: Record<string, { cam: StairCam; opts: Parameters<typeof stairAirOf>[3] }> = {
  // the whole world from high, back and to the left: the stair, the landing, the gap, the columns, the aqueduct
  wide: { cam: { X: 4 * U, E: 26 * U, Zc: -40 * U, F: 1150, hy: 330 }, opts: { dashed: 1 } },
  // A's view: from over Euclid's landing out across the gap to the lone columns (Diophantus far right)
  landing: { cam: { X: 3 * U, E: 11.4 * U, Zc: 2 * U, F: 1250, hy: 900 }, opts: {} },
  // A's arrival: in front of Diophantus on his column, the aqueduct and the Romans behind him
  diophantus: { cam: { X: 19 * U, E: 9.6 * U, Zc: 55 * U, F: 2300, hy: 1150 }, opts: {} },
  // D's view: C's last frame with the never-built stair drawn
  dashed: { cam: { X: 0, E: 6 * U, Zc: -20 * U, F: 3744, hy: 1076 }, opts: { dashed: 1 } },
};

const ProductOfGenerations: React.FC<z.infer<typeof schema>> = ({ camFrame, view }) => {
  const frame = useCurrentFrame();
  if (view !== "cut") {
    const pr = PROBES[view];
    const S = stairAirOf(pr.cam, frame, pr.cam, { ...optsC(DURATION - 1), ...pr.opts });
    return (
      <StairStage S={S}>
        <GreekStairWorld S={S} />
      </StairStage>
    );
  }
  const cf = camFrame >= 0 ? camFrame : frame;
  const S = stairAirOf(cameraC(cf), frame, C_REST, optsC(frame));
  return (
    <StairStage S={S}>
      <GreekStairWorld S={S} />
    </StairStage>
  );
};

export default ProductOfGenerations;
