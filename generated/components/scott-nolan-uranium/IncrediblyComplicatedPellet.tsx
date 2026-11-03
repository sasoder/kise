// ---------------------------------------------------------------------------
// IncrediblyComplicatedPellet: TAKE 1 of cut 2 (the amber pellet), kept as approved and delivered on 2026-11-02 (commit 378a7c6).
// The live take is IncrediblyComplicated.tsx. IncrediblyComplicated (scott-nolan-uranium, cut 2). Cheeky Pint style (stout) in real 3D (nuclearWorld.tsx). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 77 frames.
//
// CHECK LINE: "People picture nuclear as a bewildering tangle of plumbing around one small glowing thing."
//
// THE LINE: "nuclear is perceived as this incredibly complicated thing"
// WORD -> FRAME: nuclear 2 · is 9 · perceived 12 · as 20 · this 25 · incredibly 28 · complicated 40 · thing 53
// DURATION: the slot 2.544 -> 5.756 s = 3.212 s x 23.976 = 77 frames (f0..f76).
//
// THE MOTION: one slow pull-back and orbit while pipework grows, the pull-back running on to about f60. One amber pellet on
// the board; two cream pipes run past it and out of frame (from f6). From about f22 the fill swells evenly and accelerating
// (tip clock in plumbingWorld, fitted to the rendered fill) through "incredibly complicated thing" to f56: orthogonal runs on
// several depth layers branch and cross, the far layers fogged to the board tone. The amber stays visible through one gap at
// the centre; the orbit creeps and the last two tips finish into a tee. At rest every pipe leaves the frame, tees in or stands
// on a base plate.
// AMBER = uranium fuel; cream = the pipework, board = the floor and the far fog. Pipes are laid by moving tips only.
//
// SOURCES: none. No figures. Pipework is generic process plumbing (plumbingWorld.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FuelPellet, NuclearStage } from "./nuclearWorld";
import { FloorGlow, Plumbing, plumbViewAt } from "./plumbingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 77;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const IncrediblyComplicatedPellet: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = plumbViewAt(f);
  return (
    <NuclearStage
      cam={cam}
      S={f + 60}
      boardUnits={260}
      fog={[0.88, 1.55]}
      pool={{ x: 470, y: 800, strength: 1 }}
      world={
        <>
          <FloorGlow R={95} strength={0.24} />
          <FuelPellet at={[0, 0]} h={24} />
          <Plumbing f={f} />
        </>
      }
    />
  );
};

export default IncrediblyComplicatedPellet;
