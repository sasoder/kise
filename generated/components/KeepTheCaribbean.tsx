import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { SugarScene } from "./sugarScene";
import { CUT_S } from "./sugarShared";

// ---------------------------------------------------------------------------
// KeepTheCaribbean: cut E of Sarah Paine on Dwarkesh, "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands"
// (Dwarkesh map style, the sugar world). Delivered as CF/graphics/69_KeepTheCaribbean.mov.
// "And the British decide, get rid of the revolting colonies. They aren't much in this day and keep things in the Caribbean."
// A window onto ONE global-clock scene (sugarScene.tsx) shared by all five cuts, so
// every join is 0 px. The full gesture list (with the word each gesture serves) and
// the sources are in sugarE.tsx's header; the world in sugarShared.tsx.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = CUT_S.E.in;
export const DURATION = CUT_S.E.out - CUT_S.E.in;
export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const KeepTheCaribbean: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <SugarScene g={IN + frame} vignette={vignette} />;
};

export default KeepTheCaribbean;
