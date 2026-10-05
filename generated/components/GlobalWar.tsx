import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { SugarScene } from "./sugarScene";
import { CUT_S } from "./sugarShared";

// ---------------------------------------------------------------------------
// GlobalWar: cut D of Sarah Paine on Dwarkesh, "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands"
// (Dwarkesh map style, the sugar world). Delivered as CF/graphics/38_GlobalWar.mov.
// "becomes a global war. The French attack Savannah. The Spanish attack Louisiana. The French want to try to invade England from the Isle of Wight. The British are trying to fight with the French at Ushant. And then the French and the Spanish are attacking British possessions of Gibraltar, Menorca. And the French, I guess, are attacking British possessions Cape Verde Islands off Africa. The British attack French possessions at Mahe and Pondicherry in India."
// A window onto ONE global-clock scene (sugarScene.tsx) shared by all five cuts, so
// every join is 0 px. The full gesture list (with the word each gesture serves) and
// the sources are in sugarCD.tsx's header (+ notes/CD_FACTS.md); the world in sugarShared.tsx.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = CUT_S.D.in;
export const DURATION = CUT_S.D.out - CUT_S.D.in;
export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const GlobalWar: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <SugarScene g={IN + frame} vignette={vignette} />;
};

export default GlobalWar;
