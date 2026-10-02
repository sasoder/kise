import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// CovidExcuseV2 -- V2 ("vermilion ink", the China theme) of CovidExcuse, cut 3 of 4 of
// Logan Wright, "China's growth is going negative". Same line, S window
// (S 601-829), DURATION (229 f) and every gesture as the approved V1 wrapper
// CovidExcuse.tsx (its header is the gesture list); only the look changes:
// <ChinaGrowthWorld theme="china" />. See briefs/V2_CHINA.md and THEME_READY.md.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 601;
export const DURATION = 229;
if (CUTS.CovidExcuse.S0 !== S0 || CUTS.CovidExcuse.DURATION !== DURATION) {
  throw new Error("CovidExcuseV2: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock (S = S0 + frame), in the china theme. */
const CovidExcuseV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} theme="china" />;
};

export default CovidExcuseV2;
