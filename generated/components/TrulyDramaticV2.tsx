import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// TrulyDramaticV2 -- V2 ("vermilion ink", the China theme) of TrulyDramatic, cut 4 of 4 of
// Logan Wright, "China's growth is going negative". Same line, S window
// (S 829-1087), DURATION (259 f) and every gesture as the approved V1 wrapper
// TrulyDramatic.tsx (its header is the gesture list); only the look changes:
// <ChinaGrowthWorld theme="china" />. See briefs/V2_CHINA.md and THEME_READY.md.
//
// Cut 4's layer in this theme (builder C, chinaGrowthSeg4.tsx): the rings, the
// dashed 7 % level line, the connector, the bracket and its end caps are ink
// (the bracket and caps as one INK_HI group); "7%" and "1.5%" are Source Serif 4
// numerals; on "dramatic" (S 958-988) the wedge the line fell through becomes an
// ink wash (0.10) under the fine ink hatch (0.35), revealed by the same top-down
// wipe with a 24 world px feathered front (flair 6i), insets and ring cut-outs
// kept; the travelling highlight (S 1045-1086) eases vermilion -> #F2604A ->
// vermilion and lights the seal markers and the bead in their own shapes.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 829;
export const DURATION = 259;
if (CUTS.TrulyDramatic.S0 !== S0 || CUTS.TrulyDramatic.DURATION !== DURATION) {
  throw new Error("TrulyDramaticV2: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock (S = S0 + frame), in the china theme. */
const TrulyDramaticV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} theme="china" />;
};

export default TrulyDramaticV2;
