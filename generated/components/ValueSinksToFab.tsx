import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:26.920 -> 00:00:37.539 of the source cut ("so ultimately ... the fab").
export const DURATION = 319;

// The stack, in cross-section. One column, two layers, one zero line.
const BAND_X0 = 150;
const BAND_X1 = 930;
const MODEL_Y0 = 520;
const MODEL_Y1 = 1090;
const ZERO_Y = 960;
const FAB_Y0 = 1290;
const FAB_Y1 = 1650;

const BAR_W = 150;
const PRICE_X = 365;
const COST_X = 565;

// The three rest positions of the one rectangle this scene is about: the gap
// between price and cost, the model layer's negative margin, the fab's stack.
const gapTop = (costH: number) => ZERO_Y - costH;
const dipTop = ZERO_Y;
const fabTop = (slabH: number) => FAB_Y1 - slabH;

const snap = (y: number) => Math.round(y) + 0.5;

const ease = (
  frame: number,
  from: number,
  to: number,
  easing: (n: number) => number = Easing.out(Easing.cubic),
) =>
  interpolate(frame, [from, to], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Label: React.FC<{
  text: string;
  y: number;
  color: string;
  opacity: number;
  shadow: string;
  lift: number;
}> = ({text, y, color, opacity, shadow, lift}) => (
  <div
    style={{
      position: 'absolute',
      top: y,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      opacity,
      transform: `translateY(${lift}px)`,
      filter: `drop-shadow(0 2px 6px ${shadow})`,
    }}
  >
    <span
      style={{
        fontFamily: roboto.fontFamily,
        fontWeight: 700,
        fontSize: 58,
        lineHeight: 1,
        letterSpacing: '0.11em',
        marginRight: '-0.11em',
        whiteSpace: 'nowrap',
        color,
      }}
    >
      {text}
    </span>
  </div>
);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  bandLitOpacity: z.number().min(0).max(1),
  barOpacity: z.number().min(0).max(1),
  // Heights in px off the zero line. The difference between them is the whole
  // scene, so it is stated once and everything else is derived from it.
  priceHeight: z.number().min(60).max(420),
  costHeight: z.number().min(60).max(440),
  labels: z.object({model: z.string(), fab: z.string()}),
  // Beat frames from the SRT at 30fps, relative to 00:00:26.920:
  //   48 "negative value" · 91 "the model layer" · 145 "selling the tokens"
  //   178 "cost them" · 195 "infra side" · 212 "and all" · 236 "being created"
  //   250 "used at" · 262 "the chip" · 281 "the fab"
  beats: z.object({
    stack: z.number().int(),
    zero: z.number().int(),
    model: z.number().int(),
    price: z.number().int(),
    cost: z.number().int(),
    costEnd: z.number().int(),
    detach: z.number().int(),
    dipLand: z.number().int(),
    release: z.number().int(),
    fabLabel: z.number().int(),
    fabLand: z.number().int(),
  }),
});

export type ValueSinksToFabProps = z.infer<typeof schema>;

export const defaultProps: ValueSinksToFabProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.1,
  bandLitOpacity: 0.5,
  barOpacity: 0.92,
  priceHeight: 190,
  costHeight: 300,
  labels: {model: 'MODEL LAYER', fab: 'CHIP · FAB'},
  beats: {
    stack: 0,
    zero: 48,
    model: 91,
    price: 145,
    cost: 178,
    costEnd: 199,
    detach: 212,
    dipLand: 236,
    release: 250,
    fabLabel: 262,
    fabLand: 281,
  },
});

const ValueSinksToFab: React.FC<ValueSinksToFabProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  bandLitOpacity,
  barOpacity,
  priceHeight,
  costHeight,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const slabH = costHeight - priceHeight;

  // Both bands are already part-way in on frame 0 — the cut lands on a scene
  // that is arriving, not on an empty frame.
  const modelIn = ease(frame, beats.stack - 6, beats.stack + 10);
  const fabIn = ease(frame, beats.stack - 2, beats.stack + 16);
  const zeroDraw = ease(frame, beats.zero, beats.zero + 14, Easing.inOut(Easing.cubic));
  const modelLift = ease(frame, beats.model, beats.model + 14, Easing.inOut(Easing.cubic));
  // "negative value": the tray under the line is claimed long before anything
  // is in it.
  const lossZone = ease(frame, beats.zero + 6, beats.zero + 26, Easing.inOut(Easing.cubic));

  const priceGrow = ease(frame, beats.price, beats.price + 12);
  // Taller than the price bar and drawn over nearly twice as many frames — the
  // shortfall is encoded in the size and in the time it takes to arrive.
  const costGrow = ease(frame, beats.cost, beats.costEnd, Easing.inOut(Easing.cubic));
  const bridge = ease(frame, beats.costEnd - 3, beats.costEnd + 11, Easing.inOut(Easing.cubic));

  // Two drops of one object: deliberate down to the ledger, then gravity.
  const drop1 = ease(frame, beats.detach, beats.dipLand, Easing.inOut(Easing.cubic));
  const drop2 = ease(frame, beats.release, beats.fabLand, Easing.in(Easing.quad));

  const ghost = ease(frame, beats.release, beats.release + 12);
  const recede = interpolate(frame, [beats.release, beats.release + 18], [1, 0.34], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fabLabelIn = ease(frame, beats.fabLabel, beats.fabLabel + 12);
  const fabLift = ease(frame, beats.fabLand, beats.fabLand + 14, Easing.inOut(Easing.cubic));
  const impact = interpolate(
    frame,
    [beats.fabLand, beats.fabLand + 6, beats.fabLand + 22],
    [0, 1, 0],
    {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const landRing = interpolate(
    frame,
    [beats.fabLand, beats.fabLand + 10, beats.fabLand + 30],
    [0, 1, 0],
    {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const priceTop = ZERO_Y - priceHeight * priceGrow;
  const costTop = ZERO_Y - costHeight * costGrow;

  // Before the detach the slab IS the exposed part of the cost bar, measured
  // off the two bars actually on screen; after it, it is a rigid block moving
  // down a single path. Never a parallel timer.
  const detached = drop1 > 0;
  const liveSlabH = Math.max(0, priceTop - costTop);
  const slabHeight = detached ? slabH : liveSlabH;
  const slabTop = detached
    ? gapTop(costHeight) + (dipTop - gapTop(costHeight)) * drop1 + (fabTop(slabH) - dipTop) * drop2
    : costTop;

  const landed = drop2 > 0.999;
  const slabColor = landed ? accent : ink;
  const squashY = 1 - 0.09 * impact;
  const squashX = 1 + 0.05 * impact;
  const slabBottom = slabTop + slabHeight;

  const bandOpacity = (dimOpacity + (bandLitOpacity - dimOpacity) * modelLift) * recede;
  const barsOpacity = barOpacity * recede;
  const fabBandOpacity = dimOpacity + (0.9 - dimOpacity) * fabLift;

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The model layer. */}
          <g
            opacity={modelIn}
            transform={`translate(0 ${(MODEL_Y0 + MODEL_Y1) / 2}) scale(1 ${
              0.94 + 0.06 * modelIn
            }) translate(0 ${-(MODEL_Y0 + MODEL_Y1) / 2})`}
          >
            <rect
              x={BAND_X0}
              y={snap(MODEL_Y0)}
              width={BAND_X1 - BAND_X0}
              height={MODEL_Y1 - MODEL_Y0}
              rx={10}
              fill="none"
              stroke={ink}
              strokeWidth={3}
              opacity={bandOpacity}
            />

            <rect
              x={BAND_X0}
              y={snap(ZERO_Y)}
              width={BAND_X1 - BAND_X0}
              height={MODEL_Y1 - ZERO_Y}
              fill={ink}
              opacity={0.07 * lossZone * (0.5 + 0.5 * recede)}
            />

            {/* Zero. Everything above it is margin, everything below is loss. */}
            <line
              x1={BAND_X0}
              y1={snap(ZERO_Y)}
              x2={BAND_X0 + (BAND_X1 - BAND_X0) * zeroDraw}
              y2={snap(ZERO_Y)}
              stroke={ink}
              strokeWidth={3}
              opacity={0.62 * recede}
            />

            {/* What they charge for the tokens. */}
            <rect
              x={PRICE_X}
              y={priceTop}
              width={BAR_W}
              height={priceHeight * priceGrow}
              fill={ink}
              opacity={barsOpacity * (priceGrow > 0 ? 1 : 0)}
            />

            {/* What the infra costs them — hollow, so the slab inside it reads
                as the part the price does not cover. */}
            <rect
              x={COST_X + 1.5}
              y={costTop}
              width={BAR_W - 3}
              height={costHeight * costGrow}
              fill="none"
              stroke={ink}
              strokeWidth={3}
              opacity={barsOpacity * (costGrow > 0 ? 1 : 0)}
            />

            {/* The price level, carried across to the cost bar. */}
            <line
              x1={PRICE_X + BAR_W}
              y1={snap(ZERO_Y - priceHeight)}
              x2={PRICE_X + BAR_W + (COST_X + BAR_W - PRICE_X - BAR_W) * bridge}
              y2={snap(ZERO_Y - priceHeight)}
              stroke={ink}
              strokeWidth={3}
              strokeDasharray="14 12"
              opacity={0.55 * bridge * recede}
            />

            {/* The hole the slab left behind on the model layer's ledger. */}
            <rect
              x={COST_X}
              y={dipTop}
              width={BAR_W}
              height={slabH}
              fill="none"
              stroke={ink}
              strokeWidth={3}
              opacity={0.45 * ghost}
            />
          </g>

          {/* The chip and the fab. Empty and waiting from the first frame. */}
          <g
            opacity={fabIn}
            transform={`translate(0 ${(FAB_Y0 + FAB_Y1) / 2}) scale(1 ${
              0.94 + 0.06 * fabIn
            }) translate(0 ${-(FAB_Y0 + FAB_Y1) / 2})`}
          >
            <rect
              x={BAND_X0}
              y={snap(FAB_Y0)}
              width={BAND_X1 - BAND_X0}
              height={FAB_Y1 - FAB_Y0}
              rx={10}
              fill={accent}
              fillOpacity={0.08 * fabLift}
              stroke={fabLift > 0 ? accent : ink}
              strokeWidth={3}
              opacity={fabBandOpacity}
            />
            <line
              x1={BAND_X0}
              y1={snap(FAB_Y1)}
              x2={BAND_X1}
              y2={snap(FAB_Y1)}
              stroke={fabLift > 0 ? accent : ink}
              strokeWidth={5}
              opacity={fabBandOpacity}
            />
            <rect
              x={COST_X - 40 * landRing}
              y={fabTop(slabH) - 40 * landRing}
              width={BAR_W + 80 * landRing}
              height={slabH + 40 * landRing}
              fill="none"
              stroke={accent}
              strokeWidth={3}
              opacity={0.5 * landRing}
            />
          </g>

          {/* The one rectangle: the gap, then the loss, then the capture. */}
          <rect
            x={COST_X}
            y={slabTop}
            width={BAR_W}
            height={slabHeight}
            fill={slabColor}
            opacity={slabHeight > 0.5 ? (detached ? barOpacity : barsOpacity) : 0}
            transform={`translate(${COST_X + BAR_W / 2} ${slabBottom}) scale(${squashX} ${squashY}) translate(${-(
              COST_X +
              BAR_W / 2
            )} ${-slabBottom})`}
          />
        </g>
      </svg>

      <Label
        text={labels.model}
        y={MODEL_Y0 + 44}
        color={ink}
        opacity={modelLift * (0.35 + 0.65 * recede)}
        shadow={shadow}
        lift={(1 - modelLift) * 14}
      />
      <Label
        text={labels.fab}
        y={FAB_Y0 + 44}
        color={ink}
        opacity={fabLabelIn * (1 - fabLift)}
        shadow={shadow}
        lift={(1 - fabLabelIn) * 14}
      />
      <Label
        text={labels.fab}
        y={FAB_Y0 + 44}
        color={accent}
        opacity={fabLabelIn * fabLift}
        shadow={shadow}
        lift={0}
      />
    </AbsoluteFill>
  );
};

export default ValueSinksToFab;
