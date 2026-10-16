import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { A_DUR, A_IN, IraqABScene } from "./iraqAB";

// ---------------------------------------------------------------------------
// LimitedObjectives: cut A of Si Sheppard on Dwarkesh, "Sheppard_Regime_change_in_Iraq_was_the_easy_part"
// (Dwarkesh map style, Iraq world). Delivered as CF/graphics/00_LimitedObjectives.mov.
// "Speaking of Iraq, the war that didn't go remotely as well as the first one. The first one was for limited objectives. This one's for unlimited objectives,"
// IN global f12, 265 frames. A window onto ONE global-clock scene (iraqAB.tsx,
// IraqABScene) shared with the other cut, so the A -> B join is 0 px. The full
// gesture list (with the word each gesture serves) and the sources are in
// iraqAB.tsx's header.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = A_IN;
export const DURATION = A_DUR;
export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const LimitedObjectives: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <IraqABScene g={IN + frame} vignette={vignette} />;
};

export default LimitedObjectives;
