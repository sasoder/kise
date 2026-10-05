import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { B_DUR, B_IN, IraqABScene } from "./iraqAB";

// ---------------------------------------------------------------------------
// RegimeChangeInBaghdad: cut B of Si Sheppard on Dwarkesh, "Sheppard_Regime_change_in_Iraq_was_the_easy_part"
// (Dwarkesh map style, Iraq world). Delivered as CF/graphics/11_RegimeChangeInBaghdad.mov.
// "regime change in Baghdad. That part turns out to be easy. But the problem when you do regime change is the loaded diaper is yours, right? Because now what?"
// IN global f277, 322 frames. A window onto ONE global-clock scene (iraqAB.tsx,
// IraqABScene) shared with the other cut, so the A -> B join is 0 px. The full
// gesture list (with the word each gesture serves) and the sources are in
// iraqAB.tsx's header.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = B_IN;
export const DURATION = B_DUR;
export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const RegimeChangeInBaghdad: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <IraqABScene g={IN + frame} vignette={vignette} />;
};

export default RegimeChangeInBaghdad;
