// ---------------------------------------------------------------------------
// TechLogosPop (nik-neobanks-us, cut 24). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Transparent overlay 1080x1920, 23.976 fps, 87 frames. Logos only, no photo: the user overlays it on the Apple Park
// still themselves (user, Nov 5: "just add these Google, Apple and Meta logos ... transparent background. I can just
// overlay them."). Rev 2 (user, Nov 5): no cards ("why are they in the cream or white boxes with rounded corners"):
// the bare marks in the house cream, and "instead of popping up ... slide up and fade in very subtly".
//
// CHECK LINE: "The Google, Apple and Meta marks, cream, no cards, slide up a little and fade in one after another on
// 'tech companies', in a row over the ring's courtyard as the still sits in the edit, and hold; everything else is
// transparent."
//
// THE LINE: "The traditional tech companies, they don't want to be regulated because it kills their business."
// WORD -> FRAME (Whisper, may run ~5 f early): traditional f2 · tech f18 · companies f24 · they f33 · because f50.
// DURATION: the slot 24.775 -> 28.403 s (sequence frames 594 -> 681) = 87 frames (f0..f86).
//
// PLACE: the still (Scale 28.125 %, centred) puts the courtyard (photo x 835..3010, y 1010..1698; see
// TraditionalTechCompanies SOURCES) at screen x 235..847, y 884..1077, centre y 980. Marks in a 150 px optical box,
// centres 220 px apart (x 320 / 540 / 760), row centre y 980: they land in the courtyard at default Motion.
// MOTION: each mark rises 26 px and fades 0 -> 1 over 14 f (ease-out cubic), Google f10, Apple f16, Meta f22, then
// holds. A soft two-layer drop shadow (the house "rest" elevation, as a CSS filter on the mark) keeps cream legible
// on the aerial.
// Logos: the inlined marks of TraditionalTechCompanies (Simple Icons Google and Apple, lobehub Meta).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, ELEVATION, clamp01, easeOutCubic, opticalFit } from "../kits/cheeky-pint/stoutShared";
import { MARKS, type Mark } from "./TraditionalTechCompanies";

export const FPS = 24000 / 1001;
export const DURATION = 87;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const BOX = 150;
const ROW = { cy: 980, xs: [320, 540, 760] } as const;
const START_F = [10, 16, 22] as const;
const IN_F = 14;
const RISE = 26;
/** the house "rest" shadow, scaled from its 96-px recipe to the 150-px mark */
const SH_S = BOX / 96;

const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const SHADOW = [ELEVATION.rest.key, ELEVATION.rest.amb]
  .map((l) => `drop-shadow(${fx(l.dx * SH_S)}px ${fx(l.dy * SH_S)}px ${fx(l.blur * SH_S)}px ${hexA(COLOR.shadow, l.a)})`)
  .join(" ");

const MarkFigure: React.FC<{ m: Mark; cx: number; cy: number }> = ({ m, cx, cy }) => {
  const [bx, by, bw, bh] = m.box;
  const fit = opticalFit(bw, bh, m.fill, m.cy, BOX);
  const y = cy + (fit.cy - BOX / 2);
  const tx = cx - (bx + bw / 2) * fit.sc;
  const ty = y - (by + bh / 2) * fit.sc;
  return (
    <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${fx(fit.sc)})`} fill={COLOR.cream}>
      <path d={m.d} fillRule={m.rule} />
    </g>
  );
};

const TechLogosPop: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {[0, 1, 2].map((i) => {
        const t = clamp01((f - START_F[i]) / IN_F);
        if (t <= 0) return null;
        const e = easeOutCubic(t);
        return (
          <svg
            key={i}
            width={1080}
            height={1920}
            style={{ position: "absolute", left: 0, top: 0, opacity: e, filter: SHADOW, transform: `translateY(${fx(RISE * (1 - e))}px)` }}
          >
            <MarkFigure m={MARKS[i]} cx={ROW.xs[i]} cy={ROW.cy} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

export default TechLogosPop;
