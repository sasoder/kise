import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { SugarScene } from "./sugarScene";
import { CUT_S } from "./sugarShared";

// ---------------------------------------------------------------------------
// ThirteenColonies: cut A of Sarah Paine on Dwarkesh, "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands"
// (Dwarkesh map style, the sugar world). Delivered as CF/graphics/01_ThirteenColonies.mov.
// "The 13 revolting colonies, they had no intention of doing regime change in London."
// A window onto ONE global-clock scene (sugarScene.tsx) shared by all five cuts, so
// every join is 0 px. The full gesture list (with the word each gesture serves) and
// the sources are in sugarAB.tsx's header; the world in sugarShared.tsx.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = CUT_S.A.in;
export const DURATION = CUT_S.A.out - CUT_S.A.in;
export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const ThirteenColonies: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <SugarScene g={IN + frame} vignette={vignette} />;
};

export default ThirteenColonies;
