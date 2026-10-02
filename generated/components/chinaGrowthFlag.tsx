import React from "react";
import { AbsoluteFill } from "remotion";
import { FRAME_H, FRAME_W, smoothstep, squirclePath } from "./fieldShared";
import { RISE_PX, easeOutCubic, enterU, wordOn } from "./chinaGrowthGeom";
import { textBlurPx } from "./chinaGrowthShared";
import { CHINA_RED, paperShadow, useTheme } from "./chinaGrowthTheme";

// ---------------------------------------------------------------------------
// chinaGrowthFlag — V3 (briefs/V3_FLAG.md): the flag of the PRC as the chart's
// title. The client, editing with V2: "can we maybe add a china flag to the top
// of the chart just to clarify". Builder A.
//
// SCREEN space, horizontally centred: 144 x 96 px centred on (540, 150), so it
// occupies x 468-612, y 102-198, above the whole Stage (the topmost layer). It
// does not sway, drift or bob: it is the chart's title and the chart moves under
// it. Nothing ever passes under it (measured on every frame; see the report).
//
// DRAWING. The approved China flag of DidTheyJustHockeyStick.tsx ("The flag of
// China"): the official 30 x 20 unit grid, the large star centred on (5, 5)
// with a circumscribed radius of 3 units and a point straight up, and four small
// stars of radius 1 unit at (10, 2), (12, 4), (12, 7) and (10, 9), each turned so
// one point aims at the large star's centre; 10-vertex stars, inner radius
// 0.382 R. One outline, the house squircle (squirclePath, SQUIRCLE_RATIO 0.012,
// floor 2 -> 2 px corners here), used twice: as the field and as the clip the
// stars are drawn inside.
//   field  CHINA_RED #D0281C, the same red as the line, on purpose: the flag
//          names what the red means
//   stars  flag yellow #FFDE00, no outline
//   shadow the warm paper shadow the red line carries (paperShadow at k = 1)
//
// TIMING. It enters on "China" (S 10.6) with the V2 text entrance, the same
// curve and easing as Label: slide up 24 screen px (ease-out cubic), fade in
// (smoothstep) and blur in 6 -> 0 px over 12 f, landing on the word (so it
// starts 8 f before it: S 2.6-14.6). Then it holds, still, to S 1087. It is a
// function of S only, so it is identical across every join.
// ---------------------------------------------------------------------------

export const FLAG_W = 144;
export const FLAG_H = 96;
export const FLAG_CX = 540;
export const FLAG_CY = 150;
export const FLAG_X0 = FLAG_CX - FLAG_W / 2; // 468
export const FLAG_Y0 = FLAG_CY - FLAG_H / 2; // 102
/** The stars' yellow (the PRC flag's own), used nowhere else. */
export const FLAG_YELLOW = "#FFDE00";
/** It lands on "China". */
export const FLAG_WORD_S = wordOn("ChinaGrowing", "China");

const UNIT = FLAG_W / 30; // 4.8 px: the star grid scales with the flag
type P = { x: number; y: number };
const at = (ux: number, uy: number): P => ({ x: FLAG_X0 + ux * UNIT, y: FLAG_Y0 + uy * UNIT });
const STAR_INNER = 0.382;
/** A five-pointed star as a 10-vertex polygon, outer radius r, its first POINT at angle a0. */
const star = (c: P, r: number, a0: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 === 0 ? r : r * STAR_INNER;
    const a = a0 + (i * Math.PI) / 5;
    return `${i ? "L" : "M"}${(c.x + rr * Math.cos(a)).toFixed(3)} ${(c.y + rr * Math.sin(a)).toFixed(3)}`;
  }).join("") + "Z";
const STARS = [
  star(at(5, 5), 3 * UNIT, -Math.PI / 2),
  ...[
    [10, 2],
    [12, 4],
    [12, 7],
    [10, 9],
  ].map(([ux, uy]) => star(at(ux, uy), UNIT, Math.atan2(5 - uy, 5 - ux))),
];
const OUTLINE = squirclePath(FLAG_W, FLAG_H);
const OUTLINE_AT = `translate(${FLAG_X0} ${FLAG_Y0})`;

/** The title flag at story frame S (null before its entrance starts). */
export const ChinaFlagTitle: React.FC<{ S: number }> = ({ S }) => {
  const th = useTheme();
  const a = enterU(S, FLAG_WORD_S);
  if (a <= 0) return null;
  const lift = (1 - easeOutCubic(a)) * RISE_PX;
  const blur = textBlurPx(a, 0, th);
  const filter = (blur > 0.01 ? `blur(${blur.toFixed(3)}px) ` : "") + paperShadow(1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
        <defs>
          <clipPath id="cg-flag-clip">
            <path d={OUTLINE} transform={OUTLINE_AT} />
          </clipPath>
        </defs>
        <g transform={`translate(0 ${lift.toFixed(3)})`} opacity={smoothstep(a).toFixed(4)} style={{ filter }}>
          <path d={OUTLINE} transform={OUTLINE_AT} fill={CHINA_RED} />
          <g clipPath="url(#cg-flag-clip)">
            {STARS.map((d, i) => (
              <path key={i} d={d} fill={FLAG_YELLOW} />
            ))}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
