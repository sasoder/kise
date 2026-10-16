import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS, EFGScene, FPS as SCENE_FPS } from "./iraqEFG";

// WhoAreTheNeighbors: cut F of "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (Dwarkesh with
// Si Sheppard; Dwarkesh map style), a window onto the E/F/G global-clock scene in
// iraqEFG.tsx (the gesture list, timings and sources are in its header).
// "And oh, by the way, who are the neighbors? Three of them have real ambitions for regional influence. Saudi Arabia, Iran, and Turkey. They're going to be involved, whether you like it or not." IN g2380 (99.17 s), 261 f.
// Opaque 1080x1920, 24 fps; frame f = global frame CUTS.F.g0 + f.

export const DURATION = CUTS.F.dur;
export const FPS = SCENE_FPS;
export const G0 = CUTS.F.g0;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const WhoAreTheNeighbors: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <EFGScene g={G0 + frame} vignette={vignette} />;
};

export default WhoAreTheNeighbors;
