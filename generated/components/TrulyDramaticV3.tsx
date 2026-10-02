import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// TrulyDramaticV3 -- V3 of TrulyDramatic, cut 4 of 4 of Logan Wright, "China's growth is going
// negative": V2 (the china theme) plus the PRC flag as the chart's title
// (briefs/V3_FLAG.md, chinaGrowthFlag.tsx). Same line, S window (S 829-1087),
// DURATION (259 f), gestures and look as TrulyDramaticV2.tsx; the one addition is the
// flag, top centre in screen space, entering on "China" (S 10.6) and holding.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 829;
export const DURATION = 259;
if (CUTS.TrulyDramatic.S0 !== S0 || CUTS.TrulyDramatic.DURATION !== DURATION) {
  throw new Error("TrulyDramaticV3: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock (S = S0 + frame): the china theme with the title flag. */
const TrulyDramaticV3: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} theme="china" flag />;
};

export default TrulyDramaticV3;
