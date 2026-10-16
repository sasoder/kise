import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS, EFGScene, FPS as SCENE_FPS } from "./iraqEFG";

// SacredShiaShrine: cut G of "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (Dwarkesh with
// Si Sheppard; Dwarkesh map style), a window onto the E/F/G global-clock scene in
// iraqEFG.tsx (the gesture list, timings and sources are in its header).
// "And it often doesn't take that much involvement to really set things off, right? Sometimes a car bomb will do it. This is a sacred Shia shrine. Car bomb or whatever, blow it up. It set off a big sectarian war. It's very, very difficult to stabilize these places." IN g2641 (110.04 s), 448 f.
// Opaque 1080x1920, 24 fps; frame f = global frame CUTS.G.g0 + f.

export const DURATION = CUTS.G.dur;
export const FPS = SCENE_FPS;
export const G0 = CUTS.G.g0;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const SacredShiaShrine: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <EFGScene g={G0 + frame} vignette={vignette} />;
};

export default SacredShiaShrine;
