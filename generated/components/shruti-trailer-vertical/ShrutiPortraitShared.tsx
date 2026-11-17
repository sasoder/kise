import React from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { PAPER_BASE } from "../kits/core-memory/cerroShared";
import { filmWeave } from "../neal-stephenson-trailer/nealShared";
export { TallPaper, worldTransformTall } from "../kits/core-memory/deathCountShared";

// SHRUTI portrait archive collage. The approved Neal film treatment, with the existing
// 1216x2048 grain plate at its native portrait orientation. Paper geometry stays in TallPaper.
// Chain = India's outliers, as in the approved landscape cuts. No new chain meaning.
const GRAIN = "cerro/shaft/grain_tile.png";
export const PortraitFilmLife: React.FC<{
  frame: number;
  children?: React.ReactNode;
  grain?: number;
  weave?: number;
  flicker?: number;
  vignette?: number;
  seed?: string;
}> = ({ frame, children, grain = 0.16, weave = 0.8, flicker = 0.015, vignette = 0.3, seed = "neal" }) => {
  const f = Math.floor(frame);
  const wv = filmWeave(frame, weave);
  const gx = Math.floor(random(`${seed}-gx-${f}`) * 136);
  const gy = Math.floor(random(`${seed}-gy-${f}`) * 128);
  const fx = random(`${seed}-gfx-${f}`) < 0.5 ? -1 : 1;
  const fy = random(`${seed}-gfy-${f}`) < 0.5 ? -1 : 1;
  const n = Math.max(-1, Math.min(1, 0.45 * Math.sin((2 * Math.PI * frame) / 9.3 + 0.4) + 0.55 * (2 * random(`${seed}-fl-${f}`) - 1)));
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      <AbsoluteFill style={{ transform: `translate(${wv.dx}px, ${wv.dy}px) scale(1.0025)`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(0,0,0,${flicker * (1 + n)})` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse farthest-corner at 50% 48%, rgba(0,0,0,0) 46%, rgba(0,0,0,${0.35 * vignette}) 72%, rgba(0,0,0,${vignette}) 100%)` }} />
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: grain }}>
        <Img src={staticFile(GRAIN)} style={{ position: "absolute", left: -gx, top: -gy, width: 1216, height: 2048, maxWidth: "none", transform: `scale(${fx}, ${fy})` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
