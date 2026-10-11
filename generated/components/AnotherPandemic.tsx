import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, CamKey, DARK, FPS as KIT_FPS, Hatch, INK, InkStroke, Page, Pt, WorldSvg, clamp01, fell, inkPath, roughen, runCamera, smoothstep, toScreen } from "./plagueShared";

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
// THE MOTION (one eased move, f0 to the end): on f0 the camera is close on
// the left of the row (1918, 1957, 1968 big) and already gliding right; it
// glides right and eases back until the whole row of equal cream posts stands
// in frame, 2009 and 2020 coming in from the right edge, and keeps drifting
// through the hold. On the empty scale beyond 2020 a sixth post, the same form
// but flat orange and with no year, rises out of the ruler with an eased start
// and a soft landing (f24-48, "pandemic" f40); then a faint highlight runs up it.
// The ruler is an engraved scale bar (double rule, alternate decades hatched).
//
// THIS IS A ROW OF DATES, NOT A MAGNITUDE CHART: every post is the same
// height. The orange post carries no year; its place on the ruler is not a
// forecast.
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
  nextAt: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  years: [1918, 1957, 1968, 2009, 2020],
  nextAt: 2038, // where the unlabelled orange post stands on the ruler (no year shown)
});

// world: 1 year = PXY px
const PXY = 7;
const xOf = (yr: number) => (yr - 1900) * PXY;
const BASE = 1040; // the top rule of the scale bar: the posts stand on it
const BAR = 15; // gap between the two rules
const POST_H = 520; // baseline -> disc centre
const DISC_R = 17;
const Y0 = 1840;
const Y1 = 2160;
const RULE_L = xOf(Y0);
const RULE_R = xOf(Y1);

// the camera, its own key track: one eased move, then a slow drift
const CAM: CamKey[] = [
  { f: 0, x: xOf(1955), y: 800, k: 1.42 },
  { f: 34, x: xOf(1986.5), y: 962, k: 0.945 },
  { f: 78, x: xOf(1991.5), y: 968, k: 0.965 },
];

const RISE = [24, 48] as const;
const SHINE = [50, 77] as const;

const TOP_RULE = inkPath(roughen([[RULE_L, BASE], [RULE_R, BASE]], 11, 0.5));
const LOW_RULE = inkPath(roughen([[RULE_L, BASE + BAR], [RULE_R, BASE + BAR]], 12, 0.5));
const DECADES: number[] = [];
for (let y = Y0; y < Y1; y += 10) DECADES.push(y);
const BLOCKS = DECADES.filter((y) => (y / 10) % 2 === 0)
  .map((y) => `M${xOf(y)},${BASE}H${xOf(y + 10)}V${BASE + BAR}H${xOf(y)}Z`)
  .join("");
const DIVIDERS = DECADES.map((y) => `M${xOf(y)},${BASE}V${BASE + BAR}`).join("");
const TICKS = DECADES.map((y) => `M${xOf(y)},${BASE + BAR}v${y % 50 === 0 ? 20 : 12}`).join("");

// one post, drawn about x = 0 with its foot on y = 0 (up = -y)
const WB = 4.8; // half width at the foot
const WT = 3.3; // half width under the disc
const postShape = (seed: number) => {
  const left = roughen([[-WB, -9], [-WT, -POST_H]] as Pt[], seed, 0.7);
  const right = roughen([[WT, -POST_H], [WB, -9]] as Pt[], seed + 5, 0.7);
  const stake = `${inkPath([...left, ...right])}Z`;
  let ticks = "";
  for (let y = -22; y > -POST_H + DISC_R + 6; y -= 12) ticks += `M0.6,${y}l3.4,-4.6`;
  return { stake, ticks };
};
const PLINTH = `M-15,0L-12,-7L-7,-10L7,-10L12,-7L15,0Z`;
const PLINTH_SHADE = `M2,0L2,-10L7,-10L12,-7L15,0Z`;
const DISC_SHADE = `M3,${-POST_H - DISC_R + 1}A${DISC_R},${DISC_R} 0 0 1 3,${-POST_H + DISC_R - 1}A${DISC_R * 1.9},${DISC_R * 1.9} 0 0 0 3,${-POST_H - DISC_R + 1}Z`;

const Post: React.FC<{ seed: number; orange?: boolean }> = ({ seed, orange = false }) => {
  const { stake, ticks } = React.useMemo(() => postShape(seed), [seed]);
  const fill = orange ? ACCENT : INK;
  const out = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const };
  return (
    <g>
      <path d={stake} fill={fill} {...out} />
      <path d={PLINTH} fill={fill} {...out} />
      <circle cx={0} cy={-POST_H} r={DISC_R} fill={fill} {...out} />
      {orange ? null : (
        <>
          <path d={ticks} fill="none" stroke={DARK} strokeOpacity={0.7} strokeWidth={1.2} strokeLinecap="round" />
          <path d={PLINTH_SHADE} fill="url(#apDarkHatch)" />
          <path d={DISC_SHADE} fill="url(#apDarkHatch)" />
        </>
      )}
    </g>
  );
};
// the cast shade on the ruler, to the right of the foot: short hatch strokes, drawn on with `grow`
const footHatch = (x: number, grow: number) =>
  [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const len = (26 - i * 3.6) * grow;
      return `M${x + 19 + i * 6.5},${BASE - 2.5}l${(len * 0.62).toFixed(2)},${(-len).toFixed(2)}`;
    })
    .join("");

const LABEL_ANGLE = -32;
const LABEL_LEN = 118; // a 48 px year along its baseline

const AnotherPandemic: React.FC<Props> = ({ years, nextAt }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);

  // the next one: the whole post slides up out of the ruler, eased at both ends
  const rise = smoothstep(clamp01((frame - RISE[0]) / (RISE[1] - RISE[0])));
  const nx = xOf(nextAt);
  const sink = (POST_H + DISC_R + 4) * (1 - rise);
  const nextOn = frame >= RISE[0];
  const nextFoot = smoothstep(clamp01((frame - (RISE[1] - 10)) / 12));

  // hold: a faint highlight runs up the orange post
  const sh = clamp01((frame - SHINE[0]) / (SHINE[1] - SHINE[0]));
  const shY = BASE - 30 - (POST_H - 70) * smoothstep(sh);
  const shOp = Math.sin(Math.PI * sh) * 0.75;

  return (
    <Page>
      <WorldSvg
        cam={cam}
        defs={
          <>
            <Hatch id="apHatch" spacing={5.5} angle={45} width={1.5} opacity={0.85} />
            <Hatch id="apDarkHatch" spacing={3.2} angle={-45} stroke={DARK} width={1.2} opacity={0.75} />
            <clipPath id="apAboveRule">
              <rect x={nx - 120} y={0} width={240} height={BASE} />
            </clipPath>
          </>
        }
      >
        {/* the cream posts, one per pandemic, all the same height; years on one slanted line */}
        {years.map((yr, i) => {
          const x = xOf(yr);
          const sx = toScreen(cam, x, 0).x;
          // a label comes in with its post: opacity by its distance from the frame edge
          const lab = smoothstep(clamp01((1080 - 14 - (sx + (10 + LABEL_LEN * 0.85) * cam.k)) / 70)) * smoothstep(clamp01((sx + 30) / 60));
          return (
            <g key={yr}>
              <path d={footHatch(x, 1)} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={1.6} strokeLinecap="round" />
              <g transform={`translate(${x} ${BASE})`}>
                <Post seed={i * 7 + 1} />
              </g>
              <text
                transform={`translate(${x + 8} ${BASE - POST_H - DISC_R - 12}) rotate(${LABEL_ANGLE})`}
                textAnchor="start"
                fontFamily={fell}
                fontSize={48}
                letterSpacing="0.02em"
                fill={INK}
                opacity={lab}
                stroke={DARK}
                strokeOpacity={0.55}
                strokeWidth={4.5}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {yr}
              </text>
            </g>
          );
        })}

        {/* the next one: the same form, flat orange, no year, rising out of the ruler */}
        {nextOn ? (
          <>
            {nextFoot > 0 ? <path d={footHatch(nx, nextFoot)} fill="none" stroke={ACCENT} strokeOpacity={0.75} strokeWidth={1.6} strokeLinecap="round" /> : null}
            <g clipPath="url(#apAboveRule)">
              <g transform={`translate(${nx} ${BASE + sink})`}>
                <Post seed={91} orange />
              </g>
              {shOp > 0.01
                ? [
                    [110, 0.3],
                    [56, 0.5],
                    [22, 0.8],
                  ].map(([len, o]) => (
                    <line key={len} x1={nx - 1} y1={shY + len / 2} x2={nx - 1} y2={shY - len / 2} stroke="#FFF4DA" strokeOpacity={o * shOp} strokeWidth={4} strokeLinecap="round" />
                  ))
                : null}
            </g>
          </>
        ) : null}

        {/* the ruler of years: an engraved scale bar, alternate decades hatched, ticks below */}
        <path d={BLOCKS} fill="url(#apHatch)" />
        <path d={DIVIDERS} fill="none" stroke={INK} strokeWidth={1.6} />
        <path d={TICKS} fill="none" stroke={INK} strokeOpacity={0.9} strokeWidth={2.2} strokeLinecap="round" />
        <InkStroke d={LOW_RULE} width={2.2} />
        <InkStroke d={TOP_RULE} width={3.2} />
      </WorldSvg>
    </Page>
  );
};

export default AnotherPandemic;
