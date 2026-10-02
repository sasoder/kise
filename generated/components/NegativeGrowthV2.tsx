import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// NegativeGrowthV2 -- V2 ("vermilion ink", the China theme) of NegativeGrowth, cut 2 of 4 of
// Logan Wright, "China's growth is going negative". Same line, S window
// (S 353-601), DURATION (249 f) and every gesture as the approved V1 wrapper
// NegativeGrowth.tsx (its header is the gesture list); only the look changes:
// <ChinaGrowthWorld theme="china" />. See briefs/V2_CHINA.md and THEME_READY.md.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 353;
export const DURATION = 249;
if (CUTS.NegativeGrowth.S0 !== S0 || CUTS.NegativeGrowth.DURATION !== DURATION) {
  throw new Error("NegativeGrowthV2: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock (S = S0 + frame), in the china theme. */
const NegativeGrowthV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} theme="china" />;
};

export default NegativeGrowthV2;
