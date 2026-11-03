// ---------------------------------------------------------------------------
// IncrediblyComplicated (scott-nolan-uranium, cut 2), TAKE 2: the cooling tower. Take 1 (the pellet): IncrediblyComplicatedPellet.tsx.
// Cheeky Pint style (stout) in real 3D (nuclearWorld.tsx). RENDER --gl=angle. Opaque 1080x1920, 23.976 fps, 77 frames.
//
// CHECK LINE: "People picture nuclear as a bewildering tangle of plumbing around one small glowing thing."
// TAKE 2 (user, 2026-11-03): the glowing thing is a nuclear plant's cooling tower, "that kind of chimney", in the amber clay, with
// one soft cream steam plume. Timing, camera, pipes and length are take 1 unchanged.
//
// THE LINE: "nuclear is perceived as this incredibly complicated thing"
// WORD -> FRAME: nuclear 2 · is 9 · perceived 12 · as 20 · this 25 · incredibly 28 · complicated 40 · thing 53
// DURATION: the slot 2.544 -> 5.756 s = 3.212 s x 23.976 = 77 frames (f0..f76).
//
// THE MOTION: one slow pull-back and orbit while pipework grows, the pull-back running on to about f60. One amber cooling tower
// on the board, steam curling out of its mouth (coolingTower.tsx); two cream pipes run past it and out of frame (from f6). From
// about f22 the fill swells evenly and accelerating (tip clock in plumbingWorld, fitted to the rendered fill) through
// "incredibly complicated thing" to f56: orthogonal runs on several depth layers branch and cross, the far layers fogged to the
// board tone. The tower stays whole in one gap at the centre, its outline never crossed by a pipe; the orbit creeps, the steam
// keeps rising and the last two tips finish into a tee. At rest every pipe leaves the frame, tees in or stands on a base plate.
// AMBER = the nuclear plant at the heart of it (the tower); cream = the pipework and the steam, board = the floor and the far fog.
//
// SOURCES: none. No figures. Tower in the proportions of a natural-draught hyperboloid cooling tower; pipework is generic
// process plumbing (plumbingWorld.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CoolingTower, SteamPlume } from "./coolingTower";
import { NuclearStage } from "./nuclearWorld";
import { FloorGlow, Plumbing, plumbViewAt } from "./plumbingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 77;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const IncrediblyComplicated: React.FC<z.infer<typeof schema>> = () => {
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
          <FloorGlow R={110} strength={0.24} />
          <CoolingTower />
          <Plumbing f={f} />
          <SteamPlume S={f + 400} />
        </>
      }
    />
  );
};

export default IncrediblyComplicated;
