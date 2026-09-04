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
// Dylan_Elon_Arbitrage (recut) 0:03.940 -> 0:12.919, plus half a second of
// resolved hold, with the handover still crossing through it. round(8.979 * 24) + 24.
export const DURATION = 239;

export const schema = z.object({
  ...stageSchema,
  computeN: z.number().int().min(4).max(16),
  // Where the ask lands, in multiples of the $60B/GW reference.
  askMultiple: z.number().min(1).max(6),
  // Beat frames from the SRT at 24fps, relative to 00:00:03.940:
  //   0 "what elon took" · 17 "advantage" · 35 "market is he"
  //   52 "had all this" · 62 "compute" · 77 "like hey" · 87 "anthropic"
  //   109 "making like 60" · 128 "plus billion" · 145 "dollars per"
  //   156 "gigawatt" · 167 "why don't" · 173 "you just buy my"
  //   195 "a crazy" · 209 "money?"
  beats: z.object({
    elonTook: z.number().int(),
    advantage: z.number().int(),
    market: z.number().int(),
    hadAllThis: z.number().int(),
    compute: z.number().int(),
    hey: z.number().int(),
    anthropic: z.number().int(),
    sixty: z.number().int(),
    dollarsPer: z.number().int(),
    gigawatt: z.number().int(),
    justBuy: z.number().int(),
    crazy: z.number().int(),
    money: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ...stageDefaults,
  computeN: 8,
  askMultiple: 2.55,
  beats: {
    elonTook: 0,
    advantage: 17,
    market: 35,
    hadAllThis: 52,
    compute: 62,
    hey: 77,
    anthropic: 87,
    sixty: 109,
    dollarsPer: 145,
    gigawatt: 156,
    justBuy: 173,
    crazy: 195,
    money: 209,
  },
});

const GROUND_Y = 1500;
const COMPUTE_X = 250;
const AXIS_X = 600;
const BAR_W = 168;
const ANTHROPIC_X = 940;
const NODE_Y = 1672;

// The $60B/GW line sits at exactly the height of his gigawatt of compute: what
// the thing he is holding earns for whoever runs it.
const REF_Y = GROUND_Y - 8 * (BLOCK.h + BLOCK.gap);

const CAM = makeCamera({
  f: [0, 62, 84, 120, 152, 178, 206, DURATION],
  cx: [238, 262, 340, 545, 560, 560, 560, 562],
  cy: [1560, 1534, 1524, 1506, 1500, 1400, 1300, 1296],
  k: [1.04, 0.99, 0.96, 0.88, 0.88, 0.86, 0.84, 0.84],
});

const ElonArbitrage: React.FC<Props> = ({
  ink,
  accent,
  grid,
  gridBlur,
  gridBrightness,
  gridBase,
  shadow,
  computeN,
  askMultiple,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = CAM(frame);
  const k = cam.k;
  const step = BLOCK.h + BLOCK.gap;

  // The ask. One value drives the bar and the emphasis line riding on top of
  // it, so the price can never be drawn taller than it is. It rises with an
  // ease so the last stretch past the line is the fastest.
  const askRaw = clamp01((frame - beats.justBuy) / (beats.money + 12 - beats.justBuy));
  const ask = askRaw < 0.5 ? 2 * askRaw * askRaw : 1 - Math.pow(-2 * askRaw + 2, 2) / 2;
  const askY = GROUND_Y - (GROUND_Y - REF_Y) * askMultiple * ask;
  const refIn = easeOut((frame - beats.sixty) / 22);

  const channel = {
    x0: COMPUTE_X + BLOCK.w / 2,
    x1: ANTHROPIC_X - NODE_D / 2,
  };
  const channelPath = (t: number) => ({
    x: channel.x0 + (channel.x1 - channel.x0) * t,
    y: NODE_Y + Math.sin(t * Math.PI) * -14,
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
          height={2200}
          viewBox="0 0 1080 2200"
          style={{overflow: 'visible', position: 'absolute', left: 0, top: 0}}
        >
          <line
            x1={-500}
            y1={Math.round(GROUND_Y) + 0.5}
            x2={1580}
            y2={Math.round(GROUND_Y) + 0.5}
            stroke={ink}
            strokeWidth={sw(WEIGHT.context, k)}
            opacity={0.26}
          />

          {/* He already had it. Standing from the first frame and still
              accumulating through "had all this compute", landing with weight. */}
          {Array.from({length: computeN}, (_, b) => (
            <Block
              key={`c${b}`}
              x={COMPUTE_X}
              baseY={GROUND_Y - b * step}
              t={enter(frame, beats.elonTook - 30 + b * 12, fps)}
              fill={accent}
            />
          ))}

          {/* What he is handing over, crossing between them. */}
          {(() => {
            const open = easeOut((frame - beats.hey) / 20);
            if (open <= 0.002) {
              return null;
            }
            return (
              <g>
                <line
                  x1={channel.x0}
                  y1={NODE_Y}
                  x2={channel.x0 + (channel.x1 - channel.x0) * open}
                  y2={NODE_Y}
                  stroke={accent}
                  strokeWidth={sw(WEIGHT.context, k)}
                  opacity={0.42}
                />
                {Array.from({length: 4}, (_, i) => {
                  const p = ((frame - beats.hey) / 44 + i / 4) % 1;
                  if (p > open) {
                    return null;
                  }
                  const pt = channelPath(p);
                  return <circle key={`p${i}`} cx={pt.x} cy={pt.y} r={sw(12, k)} fill={accent} opacity={0.9 * Math.sin(p * Math.PI)} />;
                })}
              </g>
            );
          })()}

          {/* What a gigawatt earns them — drawn out from the axis, the line he
              prices against. */}
          {refIn > 0.002 ? (
            <line
              x1={AXIS_X - 170 * refIn}
              y1={Math.round(REF_Y) + 0.5}
              x2={AXIS_X + 420 * refIn}
              y2={Math.round(REF_Y) + 0.5}
              stroke={ink}
              strokeWidth={sw(WEIGHT.subject, k)}
              strokeLinecap="round"
              opacity={0.85}
            />
          ) : null}

          {/* The ask, rising straight past the line it is supposedly priced
              off. The overshoot is the trade, so it lands as the biggest hit. */}
          {ask > 0.002 ? (
            <>
              <rect
                x={AXIS_X - BAR_W / 2}
                y={askY}
                width={BAR_W}
                height={GROUND_Y - askY}
                rx={BLOCK.r}
                fill={accent}
                opacity={0.28}
              />
              <line
                x1={AXIS_X - BAR_W / 2 - 40}
                y1={Math.round(askY) + 0.5}
                x2={AXIS_X + BAR_W / 2 + 40}
                y2={Math.round(askY) + 0.5}
                stroke={accent}
                strokeWidth={sw(WEIGHT.emphasis, k)}
                strokeLinecap="round"
                opacity={0.97}
              />
            </>
          ) : null}
        </svg>

        {/* The figure he quotes back at them, sliding up out of the line. */}
        {(() => {
          const t = enter(frame, beats.sixty + 4, fps);
          if (t <= 0.002) {
            return null;
          }
          const unit = easeOut((frame - beats.dollarsPer) / 16);
          return (
            <div
              style={{
                position: 'absolute',
                left: AXIS_X + 150,
                top: REF_Y - 152,
                width: 340,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                opacity: clamp01(t * 1.3),
                transform: `translateY(${(1 - clamp01(t)) * 18}px)`,
              }}
            >
              <div style={typeStyle(86, ink)}>
                $60B+
              </div>
              <div style={{...typeStyle(34, ink), opacity: 0.7 * unit}}>
                Per gigawatt
              </div>
            </div>
          );
        })()}

        {/* The two parties, in the shared container. */}
        {[
          {actor: 'spacex' as const, x: COMPUTE_X, at: beats.elonTook - 12, seed: 0},
          {actor: 'anthropic' as const, x: ANTHROPIC_X, at: beats.anthropic, seed: 1},
        ].map((a) => {
          const t = enter(frame, a.at, fps);
          if (t <= 0.002) {
            return null;
          }
          return (
            <div
              key={a.actor}
              style={{
                position: 'absolute',
                left: a.x - NODE_D / 2,
                top: NODE_Y - NODE_D / 2,
              }}
            >
              <ActorNode actor={a.actor} k={k} color={ink} opacity={0.92 * clamp01(t * 1.5)} scale={t} />
            </div>
          );
        })}
      </World>
    </AbsoluteFill>
  );
};

export default ElonArbitrage;
