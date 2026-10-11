import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, CamKey, DARK, FPS as KIT_FPS, INK, INK_DEEP, Page, WorldSvg, clamp01, fell, runCamera } from "./plagueShared";

// ---------------------------------------------------------------------------
// AnotherPandemic (plague clip: Dwarkesh Patel with Kyle Harper, "Why the
// plague is so deadly to humans"; sequence 68.669 s - 71.071 s).
//
// CHECK LINE: "Pandemics have kept coming, a few every century, and the row is
// not finished: the next mark is already on its way."
//
// SPOKEN (on camera before: "To me, like,"):
//   "there's going to be another pandemic,"
// 29.97 fps, f = round((t - 68.669) * 29.97):
//   there's f0 · going f9 · to f16 · be f23 · another f27 · pandemic f40 ·
//   speech ends f72.   DURATION = 72 + 6 handle frames = 78.
//
// THE MOTION (one): on f0 the camera is close on the left of the row (1918,
// 1957, 1968 big) and already gliding right; it glides right and eases back
// until the whole row of equal cream posts stands in frame (about 1905-2055),
// 2009 and 2020 coming in from the right edge. On the empty ruler beyond 2020
// a sixth post, the same stake and disc but orange and with no year, rises out
// of the ruler at a steady speed (f26-46, "pandemic" f40). Hold: the glide
// continues slowly right (~0.6 px/frame) and a faint highlight runs up the
// orange post.
//
// THIS IS A ROW OF DATES, NOT A MAGNITUDE CHART: every post is the same
// height. The orange post carries no year; its place on the ruler is not a
// forecast. Where two posts stand close (1957/1968, 2009/2020) the second
// year is set one line higher so the numerals do not collide.
//
// SOURCES of the five dates:
//   WHO, "Past pandemics" (pandemic influenza): 1918 (H1N1), 1957 (H2N2),
//   1968 (H3N2), 2009 (H1N1pdm09).
//   WHO Director-General's opening remarks at the media briefing on COVID-19,
//   11 March 2020 (COVID-19 characterised as a pandemic): 2020.
// ---------------------------------------------------------------------------

export const FPS = KIT_FPS;
export const DURATION = 78;

export const schema = z.object({
  years: z.array(z.number()),
  raised: z.array(z.number()),
  nextAt: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  years: [1918, 1957, 1968, 2009, 2020],
  raised: [1968, 2020], // the second year of a close pair sits one line higher
  nextAt: 2036, // where the unlabelled orange post stands on the ruler (no year shown)
});

// world: 1 year = PXY px; the final framing (k 1) shows about 154 years
const PXY = 7;
const xOf = (yr: number) => (yr - 1900) * PXY;
const BASE = 1040; // the ruler
const POST_H = 520; // baseline -> disc centre (disc at y 520)
const DISC_R = 17;
const RULE_L = xOf(1860);
const RULE_R = xOf(2140);

// the camera, its own key track (damped follow trails the keys ~5 frames)
const CAM: CamKey[] = [
  { f: 0, x: xOf(1955), y: 800, k: 1.42 },
  { f: 32, x: xOf(1980), y: 960, k: 1 },
  { f: 78, x: xOf(1984), y: 960, k: 1 },
];

const RISE = [26, 46] as const;
const SHINE = [48, 77] as const;

const Post: React.FC<{ x: number; h: number; color: string; deep: string; foot: number }> = ({ x, h, color, deep, foot }) => {
  const top = BASE - h;
  const wb = 4.6; // half width at the foot
  const wt = 3.2; // half width under the disc
  const stake = `M${x - wb},${BASE}L${x - wt},${top}L${x + wt},${top}L${x + wb},${BASE}Z`;
  const shade = `M${x + 0.6},${BASE}L${x + 0.4},${top}L${x + wt},${top}L${x + wb},${BASE}Z`;
  // engraved hatch on the shaded (right) side of the stake
  let ticks = "";
  for (let y = BASE - 10; y > top + DISC_R + 4; y -= 13) ticks += `M${x + 0.8},${y}l3.2,-4.4`;
  // hatch strokes at the foot (the cast shade on the ground, to the right), drawn on with `foot`
  const hatch = [0, 1, 2, 3, 4].map((i) => {
    const x0 = x + 11 + i * 8;
    const len = (30 - i * 5) * foot;
    return `M${x0},${BASE - 3}l${len * 0.62},${-len}`;
  });
  return (
    <g>
      <path d={hatch.join("")} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={2.4} strokeLinecap="round" />
      <path d={stake} fill={color} stroke={DARK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d={shade} fill={deep} />
      {ticks ? <path d={ticks} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={1.1} strokeLinecap="round" /> : null}
      <circle cx={x} cy={top} r={DISC_R} fill={color} stroke={DARK} strokeWidth={2.4} />
      <path d={`M${x + 4.5},${top - 10}A${DISC_R - 6},${DISC_R - 6} 0 0 1 ${x + 4.5},${top + 10}`} fill="none" stroke={deep} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

const AnotherPandemic: React.FC<Props> = ({ years, raised, nextAt }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);

  const ticks: number[] = [];
  for (let y = 1860; y <= 2140; y += 5) ticks.push(y);

  // the next one: tip rising at a steady speed, disc on the tip from the start
  const rise = clamp01((frame - RISE[0]) / (RISE[1] - RISE[0]));
  const nx = xOf(nextAt);
  const nh = POST_H * rise;
  const nextOn = frame >= RISE[0];

  // hold: a faint highlight runs up the orange post
  const sh = clamp01((frame - SHINE[0]) / (SHINE[1] - SHINE[0]));
  const shY = BASE - 30 - (POST_H - 70) * sh;
  const shOp = Math.sin(Math.PI * sh) * 0.75;

  return (
    <Page>
      <WorldSvg
        cam={cam}
        defs={
          <clipPath id="apAboveRule">
            <rect x={nx - 120} y={0} width={240} height={BASE} />
          </clipPath>
        }
      >
        {/* the cream posts, one per pandemic, all the same height */}
        {years.map((yr) => (
          <g key={yr}>
            <Post x={xOf(yr)} h={POST_H} color={INK} deep={INK_DEEP} foot={1} />
            <text
              x={xOf(yr)}
              y={BASE - POST_H - DISC_R - 22 - (raised.includes(yr) ? 58 : 0)}
              textAnchor="middle"
              fontFamily={fell}
              fontSize={54}
              letterSpacing="0.02em"
              fill={INK}
              stroke={DARK}
              strokeOpacity={0.55}
              strokeWidth={5}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {yr}
            </text>
          </g>
        ))}

        {/* the next one: orange, no year, growing out of the ruler */}
        {nextOn ? (
          <g clipPath="url(#apAboveRule)">
            <Post x={nx} h={nh} color={ACCENT} deep={ACCENT_DEEP} foot={clamp01((frame - RISE[0] - 3) / 12)} />
            {shOp > 0.01
              ? [
                  [110, 0.3],
                  [56, 0.5],
                  [22, 0.8],
                ].map(([len, o]) => (
                  <line key={len} x1={nx - 1.2} y1={shY + len / 2} x2={nx - 1.2} y2={shY - len / 2} stroke="#FFF4DA" strokeOpacity={o * shOp} strokeWidth={4.4} strokeLinecap="round" />
                ))
              : null}
          </g>
        ) : null}

        {/* the ruler of years: a cream rule, a tick every five years, longer at the decades */}
        <line x1={RULE_L} y1={BASE} x2={RULE_R} y2={BASE} stroke={DARK} strokeOpacity={0.5} strokeWidth={8} />
        <line x1={RULE_L} y1={BASE} x2={RULE_R} y2={BASE} stroke={INK} strokeWidth={4} />
        {ticks.map((y) => {
          const big = y % 10 === 0;
          return <line key={y} x1={xOf(y)} y1={BASE} x2={xOf(y)} y2={BASE + (big ? 24 : 12)} stroke={INK} strokeOpacity={big ? 0.9 : 0.6} strokeWidth={big ? 3 : 2.2} />;
        })}
      </WorldSvg>
    </Page>
  );
};

export default AnotherPandemic;
