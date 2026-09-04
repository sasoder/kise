import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';
import {
  ActorNode,
  BLOCK,
  Block,
  GridBackdrop,
  NODE_D,
  TintDefs,
  WEIGHT,
  World,
  clamp01,
  easeOut,
  enter,
  makeCamera,
  stageDefaults,
  stageSchema,
  sw,
  typeStyle,
} from './_stage';

const {fontFamily} = loadFont();

export const FPS = 24;
// Dylan_Elon_Arbitrage (recut) 0:55.380 -> 1:05.560, plus half a second of
// resolved hold, with the rental still flowing through it. round(10.180 * 24) + 24.
export const DURATION = 268;

export const schema = z.object({
  ...stageSchema,
  computeN: z.number().int().min(4).max(16),
  // Beat frames from the SRT at 24fps, relative to 00:00:55.380:
  //   0 "now we've" · 14 "entered a" · 23 "regime where"
  //   38 "spacex and meta" · 59 "are saying" · 71 "actually" · 86 "i'm going"
  //   105 "compute" · 115 "and i can" · 131 "start to"
  //   139 "rent it out for" · 151 "not 13" · 172 "i can sell"
  //   195 "it for 25 50" · 229 "and more"
  beats: z.object({
    nowWeve: z.number().int(),
    entered: z.number().int(),
    regime: z.number().int(),
    spacexAndMeta: z.number().int(),
    areSaying: z.number().int(),
    imGoing: z.number().int(),
    compute: z.number().int(),
    startTo: z.number().int(),
    rentItOut: z.number().int(),
    notThirteen: z.number().int(),
    iCanSell: z.number().int(),
    twentyFive: z.number().int(),
    andMore: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ...stageDefaults,
  computeN: 8,
  beats: {
    nowWeve: 0,
    entered: 14,
    regime: 23,
    spacexAndMeta: 38,
    areSaying: 59,
    imGoing: 86,
    compute: 105,
    startTo: 131,
    rentItOut: 139,
    notThirteen: 151,
    iCanSell: 172,
    twentyFive: 195,
    andMore: 229,
  },
});

const STACK_X = 250;
const AXIS_X = 700;
const AXIS_BASE = 1500;
const NODE_Y = 1668;
// A linear price axis, in $B per gigawatt: 13, 25 and 50 land where the
// arithmetic puts them.
const PX_PER_UNIT = 17;
const priceY = (v: number) => AXIS_BASE - v * PX_PER_UNIT;

const CAM = makeCamera({
  f: [0, 80, 120, 160, 196, 224, DURATION],
  cx: [312, 324, 420, 500, 545, 566, 572],
  cy: [1544, 1528, 1520, 1470, 1330, 1200, 1196],
  k: [0.98, 1.01, 0.96, 0.92, 0.88, 0.84, 0.84],
});

const RepricingRegime: React.FC<Props> = ({
  ink,
  accent,
  grid,
  gridBlur,
  gridBrightness,
  gridBase,
  shadow,
  computeN,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = CAM(frame);
  const k = cam.k;
  const step = BLOCK.h + BLOCK.gap;

  // The price he is actually asking. One value: the marker height, the column
  // fill and the numerals all read off it, so they cannot disagree. Each jump
  // dips slightly before it leaps — anticipation — then overshoots and settles.
  const jump = (at: number, from: number, to: number) => {
    const t = (frame - at) / 22;
    if (t <= 0) {
      return from;
    }
    if (t >= 1) {
      return to;
    }
    const over = 1 + 0.08 * Math.sin(t * Math.PI) * (1 - t);
    const e = 1 - Math.pow(1 - t, 3);
    return from + (to - from) * e * over;
  };
  const price =
    frame < beats.iCanSell + 6
      ? 13
      : frame < beats.twentyFive + 10
        ? jump(beats.iCanSell + 6, 13, 25)
        : frame < beats.andMore
          ? jump(beats.twentyFive + 10, 25, 50)
          : jump(beats.andMore, 50, 70);
  const shown = easeOut((frame - beats.notThirteen) / 16);
  // The old price is refused, not merely replaced.
  const rejected = easeOut((frame - beats.iCanSell) / 14);
  const openEnded = easeOut((frame - beats.andMore) / 22);
  const markerY = priceY(price);

  // "Entered a regime": the frame itself arrives — the ground draws out from
  // the centre and the axis rises faintly, before anything is priced on it.
  const regime = easeOut((frame - beats.entered) / 30);

  const channelPath = (t: number) => ({
    x: STACK_X + BLOCK.w / 2 + (AXIS_X - 110 - STACK_X - BLOCK.w / 2) * t,
    y: AXIS_BASE - computeN * step * 0.5 - Math.sin(t * Math.PI) * 16,
  });

  return (
    <AbsoluteFill style={{backgroundColor: gridBase, fontFamily}}>
      <GridBackdrop
        grid={grid}
        gridBlur={gridBlur}
        gridBrightness={gridBrightness}
        gridBase={gridBase}
        cam={cam}
        frame={frame}
      />
      <TintDefs ink={ink} accent={accent} />

      <World cam={cam} shadow={shadow}>
        <svg
          width={1080}
          height={2400}
          viewBox="0 0 1080 2400"
          style={{overflow: 'visible', position: 'absolute', left: 0, top: 0}}
        >
          <line
            x1={540 - 1040 * regime}
            y1={Math.round(AXIS_BASE) + 0.5}
            x2={540 + 1040 * regime}
            y2={Math.round(AXIS_BASE) + 0.5}
            stroke={ink}
            strokeWidth={sw(WEIGHT.context, k)}
            opacity={0.26}
          />

          {/* The compute: three blocks standing from the last graphic, the rest
              landing on "i'm going to build the compute". */}
          {Array.from({length: computeN}, (_, b) => (
            <Block
              key={`b${b}`}
              x={STACK_X}
              baseY={AXIS_BASE - b * step}
              t={enter(frame, b < 3 ? beats.nowWeve - 30 + b * 9 : beats.imGoing + (b - 3) * 7, fps)}
              fill={accent}
            />
          ))}

          {/* Renting it out. */}
          {(() => {
            const open = easeOut((frame - beats.rentItOut) / 20);
            if (open <= 0.002) {
              return null;
            }
            return (
              <g>
                <line
                  x1={channelPath(0).x}
                  y1={channelPath(0).y}
                  x2={channelPath(open).x}
                  y2={channelPath(0).y}
                  stroke={accent}
                  strokeWidth={sw(WEIGHT.context, k)}
                  opacity={0.45}
                />
                {Array.from({length: 3}, (_, i) => {
                  const p = ((frame - beats.rentItOut) / 32 + i / 3) % 1;
                  if (p > open) {
                    return null;
                  }
                  const pt = channelPath(p);
                  return <circle key={`p${i}`} cx={pt.x} cy={pt.y} r={sw(12, k)} fill={accent} opacity={0.9 * Math.sin(p * Math.PI)} />;
                })}
              </g>
            );
          })()}

          {/* The price axis: faint from "regime", leading the marker once
              there is one. */}
          <line
            x1={AXIS_X}
            y1={AXIS_BASE}
            x2={AXIS_X}
            y2={shown > 0.002 ? markerY - 150 - 80 * openEnded : AXIS_BASE - 260 * regime}
            stroke={ink}
            strokeWidth={sw(WEIGHT.context, k)}
            opacity={0.3 * regime}
          />

          {/* The level he is refusing, drawn out from the axis, then struck. */}
          {shown > 0.002 ? (
            <g opacity={1 - 0.42 * rejected}>
              <line
                x1={AXIS_X - 92 * shown}
                y1={Math.round(priceY(13)) + 0.5}
                x2={AXIS_X + 92 * shown}
                y2={Math.round(priceY(13)) + 0.5}
                stroke={ink}
                strokeWidth={sw(WEIGHT.subject, k)}
                strokeLinecap="round"
                opacity={0.75}
              />
              <line
                x1={AXIS_X - 104}
                y1={priceY(13) + 30}
                x2={AXIS_X - 104 + 208 * rejected}
                y2={priceY(13) + 30 - 60 * rejected}
                stroke={ink}
                strokeWidth={sw(WEIGHT.structure, k)}
                strokeLinecap="round"
                opacity={0.9 * clamp01(rejected * 3)}
              />
            </g>
          ) : null}

          {/* The price he is actually asking, climbing the axis with a hit at
              every landing. */}
          {shown > 0.002 ? (
            <>
              <rect
                x={AXIS_X - 46}
                y={markerY}
                width={92}
                height={AXIS_BASE - markerY}
                rx={BLOCK.r}
                fill={accent}
                opacity={0.26}
              />
              <line
                x1={AXIS_X - 118}
                y1={Math.round(markerY) + 0.5}
                x2={AXIS_X + 118}
                y2={Math.round(markerY) + 0.5}
                stroke={accent}
                strokeWidth={sw(WEIGHT.emphasis, k)}
                strokeLinecap="round"
                opacity={0.97}
              />
            </>
          ) : null}

          {/* And more: it does not stop at fifty. Echoes climb off the top. */}
          {openEnded > 0.002
            ? Array.from({length: 3}, (_, i) => {
                const t = easeOut((frame - beats.andMore - 6 - i * 7) / 16);
                const y = priceY(76 + i * 9) - t * 18;
                return (
                  <line
                    key={`a${i}`}
                    x1={AXIS_X - (78 - i * 16) * t}
                    y1={y}
                    x2={AXIS_X + (78 - i * 16) * t}
                    y2={y}
                    stroke={accent}
                    strokeWidth={sw(WEIGHT.subject, k)}
                    strokeLinecap="round"
                    opacity={(0.7 - i * 0.2) * t}
                  />
                );
              })
            : null}
        </svg>

        {/* The figures he actually says, each sliding out from the axis on the
            beat its marker lands. */}
        {[
          {v: 13, at: beats.notThirteen + 2, size: 76, tint: ink, key: 'p13'},
          {v: 25, at: beats.iCanSell + 20, size: 94, tint: accent, key: 'p25'},
          {v: 50, at: beats.twentyFive + 26, size: 120, tint: accent, key: 'p50'},
        ].map((p) => {
          const t = enter(frame, p.at, fps);
          if (t <= 0.002) {
            return null;
          }
          const dim = p.v === 13 ? 1 - 0.55 * rejected : 1;
          return (
            <div
              key={p.key}
              style={{
                position: 'absolute',
                left: AXIS_X + 116,
                top: priceY(p.v) - p.size * 0.62,
                width: 440,
                height: p.size * 1.3 + (p.v === 13 ? 44 : 0),
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                paddingTop: p.size * 0.15,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  ...typeStyle(p.size, p.tint),
                  marginLeft: 20,
                  opacity: clamp01(t * 1.6) * dim,
                  transform: `translateY(${(1 - clamp01(t)) * 14}px)`,
                }}
              >
                {`$${p.v}B`}
              </div>
              {p.v === 13 ? (
                <div
                  style={{
                    ...typeStyle(30, ink),
                    marginLeft: 20,
                    marginTop: 8,
                    opacity: 0.7 * clamp01(t * 1.6) * dim,
                    transform: `translateY(${(1 - clamp01(t)) * 14}px)`,
                  }}
                >
                  Per gigawatt
                </div>
              ) : null}
            </div>
          );
        })}

        {/* Who is doing the repricing. */}
        {[
          {actor: 'spacex' as const, x: 175, at: beats.nowWeve - 14, seed: 0},
          {actor: 'meta' as const, x: 345, at: beats.nowWeve - 6, seed: 1},
        ].map((a) => {
          const t = enter(frame, a.at, fps);
          if (t <= 0.002) {
            return null;
          }
          return (
            <div key={a.actor} style={{position: 'absolute', left: a.x - NODE_D / 2, top: NODE_Y - NODE_D / 2}}>
              <ActorNode actor={a.actor} k={k} color={ink} opacity={0.92 * clamp01(t * 1.5)} scale={t} />
            </div>
          );
        })}
      </World>
    </AbsoluteFill>
  );
};

export default RepricingRegime;
