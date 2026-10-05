import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { SugarScene } from "./sugarScene";
import { CUT_S } from "./sugarShared";

// ---------------------------------------------------------------------------
// DownAPeg: cut C of Sarah Paine on Dwarkesh, "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands"
// (Dwarkesh map style, the sugar world). Delivered as CF/graphics/23_DownAPeg.mov.
// "a lot of people want to take Britain down a peg in this era. So the French ally with the colonies in 1778, then the Spanish ally with the French in 1779, and the Britain attacks the Dutch in 1780. So"
// A window onto ONE global-clock scene (sugarScene.tsx) shared by all five cuts, so
// every join is 0 px. The full gesture list (with the word each gesture serves) and
// the sources are in sugarCD.tsx's header (+ notes/CD_FACTS.md); the world in sugarShared.tsx.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = CUT_S.C.in;
export const DURATION = CUT_S.C.out - CUT_S.C.in;
export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const DownAPeg: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  return <SugarScene g={IN + frame} vignette={vignette} />;
};

export default DownAPeg;
