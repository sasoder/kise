import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// CovidExcuseV4 -- V4 of CovidExcuse, cut 3 of 4 of Logan Wright, "China's growth is going
// negative": V3 with the title flag in WORLD space (the client on V3: "dude it
// should ofc track to the background"). The flag is a world object on the
// chart, its title: centred on world x 500, its bottom 1.5 points (x sz(k))
// above the 10 % level, sized by the Label law with the wide-shot floor; it
// pans, zooms and sways with the camera like the gridlines and the line and
// fades at the frame edges like a label (chinaGrowthFlag.tsx, ChinaFlagWorld).
// Same line, S window (S 601-829), DURATION (229 f), gestures and look as
// CovidExcuseV3.tsx. Here the camera is below the top of the chart for the whole
// cut, so the flag stays above the frame (every frame is V2's).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 601;
export const DURATION = 229;
if (CUTS.CovidExcuse.S0 !== S0 || CUTS.CovidExcuse.DURATION !== DURATION) {
  throw new Error("CovidExcuseV4: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock (S = S0 + frame): the china theme with the title flag in world space. */
const CovidExcuseV4: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} theme="china" flag="world" />;
};

export default CovidExcuseV4;
