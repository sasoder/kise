// ---------------------------------------------------------------------------
// TechLogosPop (nik-neobanks-us, cut 24). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Transparent overlay 1080x1920, 23.976 fps, 87 frames. Logos only, no photo: the user overlays it on the Apple Park
// still themselves (user, Nov 5: "just add these Google, Apple and Meta logos. Just make them pop in with a
// transparent background. I can just overlay them."). Replaces TraditionalTechCompanies (the push) for this slot.
//
// CHECK LINE: "Three cream logo tiles (Google, Apple, Meta) pop in one after another on 'tech companies', in a row
// over the ring's courtyard as the still sits in the edit, and hold; everything else is transparent."
//
// THE LINE: "The traditional tech companies, they don't want to be regulated because it kills their business."
// WORD -> FRAME (Whisper, may run ~5 f early): traditional f2 · tech f18 · companies f24 · they f33 · because f50.
// DURATION: the slot 24.775 -> 28.403 s (sequence frames 594 -> 681) = 87 frames (f0..f86).
//
// PLACE: the still (Scale 28.125 %, centred) puts the courtyard (photo x 835..3010, y 1010..1698; see
// TraditionalTechCompanies SOURCES) at screen x 235..847, y 884..1077, centre y 980. The row (3 x 168 px, 32 px
// gaps = 568 px) is centred there, so it lands in the courtyard at default Motion; bottom 1064, above the caption band.
// POP: each tile scales up from 0 on a spring (one small overshoot, settles in ~10 f), opacity up over 2 f, the house
// lifted shadow scaling with it. Google f10, Apple f16, Meta f22, as in the push version.
// Logos: the same inlined marks as TraditionalTechCompanies (Simple Icons Google and Apple, lobehub Meta).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, clamp01, opticalFit, rectPath } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow } from "../kits/cheeky-pint/museShared";
import { MARKS, type Mark } from "./TraditionalTechCompanies";

export const FPS = 24000 / 1001;
export const DURATION = 87;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const T = 168;
const RADIUS = 0.16 * T;
const GAP = 32;
const ROW = { cy: 980, xs: [540 - T - GAP, 540, 540 + T + GAP] } as const;
const START_F = [10, 16, 22] as const;
const MARK_K = 0.84;

const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

const MarkFigure: React.FC<{ m: Mark; x: number; y: number }> = ({ m, x, y }) => {
  const [bx, by, bw, bh] = m.box;
  const box = T * MARK_K;
  const fit = opticalFit(bw, bh, m.fill, m.cy, box);
  const cx = x + T / 2;
  const cy = y + T / 2 + (fit.cy - box / 2);
  const tx = cx - (bx + bw / 2) * fit.sc;
  const ty = cy - (by + bh / 2) * fit.sc;
  return (
    <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${fx(fit.sc)})`} fill={COLOR.inkDark}>
      <path d={m.d} fillRule={m.rule} />
    </g>
  );
};

const TechLogosPop: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const s = T / 96; // the house elevation recipe is written for 96-px tiles
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="tlpCard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => {
          const local = f - START_F[i];
          if (local < 0) return null;
          const k = spring({ frame: local, fps: FPS, config: { damping: 11, stiffness: 190, mass: 0.6 } });
          const a = clamp01((local + 1) / 2);
          const x = ROW.xs[i] - T / 2;
          const y = ROW.cy - T / 2;
          return (
            <g
              key={i}
              opacity={fx(a)}
              transform={`translate(${fx(ROW.xs[i])} ${fx(ROW.cy)}) scale(${fx(k)}) translate(${fx(-ROW.xs[i])} ${fx(-ROW.cy)})`}
            >
              <UnionShadow sil={[{ d: rectPath(x, y, T, T, RADIUS) }]} s={s} elevation="rest" lift={1} contact={null} />
              <path d={rectPath(x, y, T, T, RADIUS)} fill="url(#tlpCard)" />
              <path
                d={`M${fx(x + RADIUS)} ${fx(y + EDGE.CREAM / 2)}H${fx(x + T - RADIUS)}`}
                stroke={COLOR.edge}
                strokeOpacity={ALPHA.edge}
                strokeWidth={EDGE.CREAM}
              />
              <MarkFigure m={MARKS[i]} x={x} y={y} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export default TechLogosPop;
