import React from "react";
import { JOIN_34, camEq } from "./chinaGrowthGeom";
import type { Cam } from "./chinaGrowthGeom";
import { BaseWorld, JOIN_23, Stage, camA } from "./chinaGrowthShared";
import { Seg3Layer, camSeg3 } from "./chinaGrowthSeg3";
import { Seg4Layer, camSeg4 } from "./chinaGrowthSeg4";
import { THEMES, ThemeContext } from "./chinaGrowthTheme";
import { ChinaFlagTitle, ChinaFlagWorld } from "./chinaGrowthFlag";
import { AbsoluteFill } from "remotion";
import type { ThemeName } from "./chinaGrowthTheme";

// ---------------------------------------------------------------------------
// chinaGrowthWorld — the composer (builder A). ONE picture for the whole clip:
// every cut renders <ChinaGrowthWorld S={S0 + frame} /> and nothing else.
//
// CAMERA: camA for S <= 601 (cuts 1-2), camSeg3 for 601 < S < 829 (cut 3, B),
// camSeg4 for S >= 829 (cut 4, C). camSeg3(601) === JOIN_23 and
// camSeg4(829) === JOIN_34 are checked here at module load; camSeg3(829) ===
// JOIN_34 is B's to assert in its own module (the stub cannot satisfy it).
//
// Z-ORDER (one world group under one camera transform and one global shadow):
//   1. BaseWorld "under":  band tint + edges, the negative-growth hatch, the axis
//                          (with its dent and rung wave), Q2/Q3 ticks, the
//                          INVESTMENT bar
//   2. BaseWorld "line":   the orange line, its vertex dots, its tip
//   3. Seg3Layer (B):      over the line — rings, dashed lines, ticks, labels
//   4. Seg4Layer (C):      over B — rings, level line, bracket, its hatch,
//                          labels, the travelling highlight
//   5. BaseWorld "labels": A's labels on top of everything
// A layer reads the current camera from its `cam` prop (cam.k drives sz(k) and
// the theme's shadows); it must never import this file (cycle).
//
// THEME (V2): the optional `theme` prop ("orange" = V1, the default; "china" =
// V2) is provided to the Stage, the base world and both layers through
// ThemeContext; they read it with useTheme() (chinaGrowthTheme.ts). The V1
// wrappers pass nothing, so V1 renders exactly as delivered.
//
// FLAG: the optional `flag` mode (default false) adds the PRC flag as the
// chart's title (chinaGrowthFlag.tsx):
//   "screen" (V3)  in screen space above the whole Stage, as delivered;
//   "world"  (V4)  a world object, the top layer of the Stage's world group
//                  (over A's labels, under the vignette), so it pans, zooms and
//                  sways with the camera like the gridlines and the line.
// Without it the tree is exactly V1's / V2's, so their output is unchanged.
// ---------------------------------------------------------------------------

/** Where the title flag lives: none (V1, V2), screen (V3), world (V4). */
export type FlagMode = false | "screen" | "world";

/** The camera at story frame S (camera centre + zoom). */
export const cameraAt = (S: number): Cam => (S <= 601 ? camA(S) : S < 829 ? camSeg3(S) : camSeg4(S));

if (!camEq(camSeg3(601), JOIN_23)) {
  throw new Error(`chinaGrowthWorld: camSeg3(601) ${JSON.stringify(camSeg3(601))} != JOIN_23 ${JSON.stringify(JOIN_23)}`);
}
if (!camEq(camSeg4(829), JOIN_34)) {
  throw new Error(`chinaGrowthWorld: camSeg4(829) ${JSON.stringify(camSeg4(829))} != JOIN_34 ${JSON.stringify(JOIN_34)}`);
}

export const ChinaGrowthWorld: React.FC<{ S: number; theme?: ThemeName; flag?: FlagMode }> = ({
  S,
  theme = "orange",
  flag = false,
}) => {
  const cam = cameraAt(S);
  const stage = (
    <Stage S={S} cam={cam}>
      <BaseWorld S={S} cam={cam} pass="under" />
      <BaseWorld S={S} cam={cam} pass="line" />
      <Seg3Layer S={S} cam={cam} />
      <Seg4Layer S={S} cam={cam} />
      <BaseWorld S={S} cam={cam} pass="labels" />
      {flag === "world" ? <ChinaFlagWorld S={S} cam={cam} /> : null}
    </Stage>
  );
  return (
    <ThemeContext.Provider value={THEMES[theme]}>
      {flag === "screen" ? (
        <AbsoluteFill>
          {stage}
          <ChinaFlagTitle S={S} />
        </AbsoluteFill>
      ) : (
        stage
      )}
    </ThemeContext.Provider>
  );
};
