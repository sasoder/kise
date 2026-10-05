import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS, EFGScene, FPS as SCENE_FPS } from "./iraqEFG";

// TwoThousandMilesOfBorder: cut E of "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (Dwarkesh with
// Si Sheppard; Dwarkesh map style), a window onto the E/F/G global-clock scene in
// iraqEFG.tsx (the gesture list, timings and sources are in its header).
// "In the Kuwait war, Gulf One, you're only dealing with 158 miles of that border. In the taking over the whole place, you're dealing with over 2,000 miles of that border. That's a lot of border to try to wall off from interested parties." IN g1956 (81.50 s), 424 f.
// Opaque 1080x1920, 24 fps; frame f = global frame CUTS.E.g0 + f.

export const DURATION = CUTS.E.dur;
export const FPS = SCENE_FPS;
export const G0 = CUTS.E.g0;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const TwoThousandMilesOfBorder: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <EFGScene g={G0 + frame} vignette={vignette} />;
};

export default TwoThousandMilesOfBorder;
