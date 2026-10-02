import React from "react";
import { AbsoluteFill } from "remotion";
import { FRAME_H, FRAME_W, smoothstep, squirclePath } from "./fieldShared";
import { K_REF, LABEL_FLOOR, RISE_PX, easeOutCubic, enterU, sz, wordOn, yOf } from "./chinaGrowthGeom";
import type { Cam } from "./chinaGrowthGeom";
import { edgeFactor, textBlurPx, useStageView } from "./chinaGrowthShared";
import { CHINA_RED, paperShadow, useTheme } from "./chinaGrowthTheme";

// ---------------------------------------------------------------------------
// chinaGrowthFlag — the flag of the PRC as the chart's title. The client,
// editing with V2: "can we maybe add a china flag to the top of the chart just
// to clarify". Builder A. Two placements, picked by ChinaGrowthWorld's `flag`
// mode:
//
// V3, "screen" (briefs/V3_FLAG.md): ChinaFlagTitle. SCREEN space, horizontally
// centred: 144 x 96 px centred on (540, 150), so it occupies x 468-612, y
// 102-198, above the whole Stage (the topmost layer). It does not sway, drift
// or bob. Kept exactly as delivered.
//
// V4, "world" (the coordinator's V4 note; the client on V3: "dude it should
// ofc track to the background"): ChinaFlagWorld. A WORLD object on the chart,
// drawn inside the Stage's world group as its top layer, so it pans, zooms and
// sways with the camera exactly like the gridlines and the line, and leaves the
// frame when the camera leaves the top of the chart.
//   place  centred on world x 500 (FLAG_WORLD_X): the camera's x as "China" is
//          spoken (499.5), so it lands centred on screen; its bottom edge sits
//          FLAG_GAP x sz(k) (150 world px at K_REF, 1.5 points) above the 10 %
//          level, like a label placed above() its anchor, over the zigzag and
//          clear of the "10%" label (x 260) and the peak. On "China" it lands at
//          x 470-614, y 111-207: within a few px of where V3's flag sat.
//   size   the Label size law with the wide-shot floor (labelPx's formula):
//          160 x 106.7 screen px at K_REF, 143.4 x 95.6 as it lands (k 1.037),
//          ~189 x 126 in the k 1.5 push-in, floored at 128 x 85.3 below k ~0.89
//          (the S 1087 pull-back).
//   look   drawn at its current SCREEN size and scaled by 1/k into the world, so
//          the squircle corners (2 px) and the stars are V3's drawing at every
//          zoom; paperShadow(k) inside the world group, so the shadow is the
//          line's own (4 px down, 8 px blur on screen).
//   edges  Label's edge-fade: it fades out within EDGE_SAFE (48 px) of a frame
//          edge, so it never shows clipped (cut 1: out to the left/top-left at
//          S 125-131; cut 4: in from the left at S 1022-1027).
//
// DRAWING (both). The approved China flag of DidTheyJustHockeyStick.tsx ("The
// flag of China"): the official 30 x 20 unit grid, the large star centred on
// (5, 5) with a circumscribed radius of 3 units and a point straight up, and
// four small stars of radius 1 unit at (10, 2), (12, 4), (12, 7) and (10, 9),
// each turned so one point aims at the large star's centre; 10-vertex stars,
// inner radius 0.382 R. One outline, the house squircle (squirclePath,
// SQUIRCLE_RATIO 0.012, floor 2 -> 2 px corners here), used twice: as the field
// and as the clip the stars are drawn inside.
//   field  CHINA_RED #D0281C, the same red as the line, on purpose: the flag
//          names what the red means
//   stars  flag yellow #FFDE00, no outline
//   shadow the warm paper shadow the red line carries (paperShadow)
//
// TIMING (both). It enters on "China" (S 10.6) with the V2 text entrance, the
// same curve and easing as Label: slide up 24 screen px (ease-out cubic), fade
// in (smoothstep) and blur in 6 -> 0 px over 12 f, landing on the word (so it
// starts 8 f before it: S 2.6-14.6). Then it holds to S 1087 (V4: riding with
// the world). It is a function of S only, so it is identical across every join.
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
const STAR_INNER = 0.382;
/** A five-pointed star as a 10-vertex polygon, outer radius r, its first POINT at angle a0. */
const star = (c: P, r: number, a0: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 === 0 ? r : r * STAR_INNER;
    const a = a0 + (i * Math.PI) / 5;
    return `${i ? "L" : "M"}${(c.x + rr * Math.cos(a)).toFixed(3)} ${(c.y + rr * Math.sin(a)).toFixed(3)}`;
  }).join("") + "Z";
/** The five stars of a flag whose star-grid unit is `unit` px (1/30 of its
 *  width) and whose top-left corner is (ox, oy). */
const flagStars = (unit: number, ox: number, oy: number) => {
  const at = (ux: number, uy: number): P => ({ x: ox + ux * unit, y: oy + uy * unit });
  return [
    star(at(5, 5), 3 * unit, -Math.PI / 2),
    ...[
      [10, 2],
      [12, 4],
      [12, 7],
      [10, 9],
    ].map(([ux, uy]) => star(at(ux, uy), unit, Math.atan2(5 - uy, 5 - ux))),
  ];
};
const STARS = flagStars(UNIT, FLAG_X0, FLAG_Y0);
const OUTLINE = squirclePath(FLAG_W, FLAG_H);
const OUTLINE_AT = `translate(${FLAG_X0} ${FLAG_Y0})`;

/** V3: the title flag in SCREEN space at story frame S (null before its
 *  entrance starts). */
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

// --- V4: the flag as a world object ------------------------------------------
/** Screen width at K_REF, px (the Label law's reference size): 143.4 x 95.6
 *  on screen as it lands on "China" (k 1.037). */
export const FLAG_PX_W = 160;
/** World x of the flag's centre: the camera's x on "China" (499.5). */
export const FLAG_WORLD_X = 500;
/** The level the flag sits above: the chart's top (10 %). */
export const FLAG_BASE_Y = yOf(10);
/** World px at K_REF (x sz(k), like a label's gap) from the 10 % level up to
 *  the flag's bottom edge: 1.5 points. */
export const FLAG_GAP = 150;
/** World width of the flag at camera k: labelPx's law and wide-shot floor. */
export const flagWorldW = (k: number) => Math.max((FLAG_PX_W / K_REF) * sz(k), (LABEL_FLOOR * FLAG_PX_W) / k);
/** The flag's world box at story frame S under camera zoom k, entrance lift
 *  included (`a` is the raw entrance progress). For clearance checks too. */
export const flagWorldBox = (S: number, k: number) => {
  const a = enterU(S, FLAG_WORD_S);
  const w = flagWorldW(k);
  const h = (w * 2) / 3;
  const lift = (1 - easeOutCubic(a)) * (RISE_PX / k);
  const y1 = FLAG_BASE_Y - FLAG_GAP * sz(k) + lift;
  return { a, w, h, lift, x0: FLAG_WORLD_X - w / 2, x1: FLAG_WORLD_X + w / 2, y0: y1 - h, y1 };
};

/** V4: the title flag in WORLD space, a child of the Stage (inside its world
 *  group), at story frame S under camera `cam`. */
export const ChinaFlagWorld: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const th = useTheme();
  const view = useStageView();
  const k = cam.k;
  const b = flagWorldBox(S, k);
  if (b.a <= 0) return null;
  const op = smoothstep(b.a) * edgeFactor(view, b.x0, b.y0, b.x1, b.y1);
  if (op <= 0.002) return null;
  // drawn at its current screen size, then scaled by 1/k into the world
  const wS = b.w * k;
  const hS = b.h * k;
  const outline = squirclePath(wS, hS);
  const stars = flagStars(wS / 30, 0, 0);
  const blur = textBlurPx(b.a, 0, th);
  const filter = (blur > 0.01 ? `blur(${(blur / k).toFixed(3)}px) ` : "") + paperShadow(k);
  return (
    <g opacity={op.toFixed(4)} style={{ filter }}>
      <g transform={`translate(${b.x0.toFixed(3)} ${b.y0.toFixed(3)}) scale(${(1 / k).toFixed(6)})`}>
        <defs>
          <clipPath id="cg-flag-clip-world">
            <path d={outline} />
          </clipPath>
        </defs>
        <path d={outline} fill={CHINA_RED} />
        <g clipPath="url(#cg-flag-clip-world)">
          {stars.map((d, i) => (
            <path key={i} d={d} fill={FLAG_YELLOW} />
          ))}
        </g>
      </g>
    </g>
  );
};
