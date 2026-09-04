import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:26.920 -> 00:00:37.539 of the source cut ("so ultimately ... the fab").
export const DURATION = 319;

// No containers. One line for the model layer's ledger, one for the fab floor,
// and a row of slots where the tokens get sold.
const RULE_X0 = 150;
const RULE_X1 = 930;
const SLOT_X0 = 192;
const PITCH = 92;
const BAR_W = 52;

const ZERO_Y = 760;
const FAB_Y = 1440;
const COST_H = 210;
const PRICE_H = 130;
const REM_H = COST_H - PRICE_H;
const BAR_TOP = ZERO_Y - COST_H;
const FILL_GAP = 9;
const FAB_TOP = FAB_Y - REM_H;

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
  litOpacity: z.number().min(0).max(1),
  barOpacity: z.number().min(0).max(1),
  slots: z.number().int().min(4).max(14),
  // Below 1 the interval between sales shrinks as the run goes on: the rate is
  // the point, not the individual token.
  curve: z.number().min(0.4).max(1.6),
  labels: z.object({model: z.string(), fab: z.string()}),
  // Beat frames from the SRT at 30fps, relative to 00:00:26.920:
  //   48 "negative value" · 91 "the model layer" · 145 "selling the tokens"
  //   178 "cost them" · 212 "and all" · 250 "used at" · 262 "the chip"
  //   281 "the fab"
  beats: z.object({
    rule: z.number().int(),
    loss: z.number().int(),
    model: z.number().int(),
    slots: z.number().int(),
    floor: z.number().int(),
    first: z.number().int(),
    last: z.number().int(),
    fabLabel: z.number().int(),
    flip: z.number().int(),
    recede: z.number().int(),
  }),
});

export type ValueSinksToFabV2Props = z.infer<typeof schema>;

export const defaultProps: ValueSinksToFabV2Props = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.1,
  litOpacity: 0.62,
  barOpacity: 0.92,
  slots: 8,
  curve: 0.68,
  labels: {model: 'MODEL LAYER', fab: 'CHIP · FAB'},
  beats: {
    rule: 0,
    loss: 48,
    model: 91,
    slots: 104,
    floor: 122,
    first: 148,
    last: 227,
    fabLabel: 262,
    flip: 268,
    recede: 272,
  },
});

// One sale, start to finish: the cost goes up, the price fills part of it, and
// what is left over falls through the ledger and keeps going.
const SALE = {
  cost: [0, 11],
  price: [4, 15],
  drop: [16, 26],
  release: [32, 48],
  notch: [32, 42],
} as const;

const ValueSinksToFabV2: React.FC<ValueSinksToFabV2Props> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  litOpacity,
  barOpacity,
  slots,
  curve,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ruleDraw = ease(frame, beats.rule - 14, beats.rule + 12, Easing.inOut(Easing.cubic));
  const lossZone = ease(frame, beats.loss, beats.loss + 22, Easing.inOut(Easing.cubic));
  const modelLift = ease(frame, beats.model, beats.model + 14, Easing.inOut(Easing.cubic));
  const floorIn = ease(frame, beats.floor, beats.floor + 16);
  const fabLabelIn = ease(frame, beats.fabLabel, beats.fabLabel + 12);
  const recede = interpolate(frame, [beats.recede, beats.recede + 20], [1, 0.42], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // The flip sweeps left to right across the row, arriving on "the fab".
  const flipAt = (i: number) => beats.flip + i * 1.5;
  const fabFlip = ease(frame, flipAt(slots - 1), flipAt(slots - 1) + 8);

  const slotX = (i: number) => SLOT_X0 + PITCH * i;
  const startOf = (i: number) =>
    beats.first + (beats.last - beats.first) * Math.pow(slots === 1 ? 1 : i / (slots - 1), curve);

  const sales = Array.from({length: slots}, (_, i) => {
    const local = frame - startOf(i);
    const costGrow = ease(local, SALE.cost[0], SALE.cost[1]);
    const priceGrow = ease(local, SALE.price[0], SALE.price[1]);
    const drop = ease(local, SALE.drop[0], SALE.drop[1], Easing.inOut(Easing.cubic));
    const release = ease(local, SALE.release[0], SALE.release[1], Easing.in(Easing.quad));
    const notch = ease(local, SALE.notch[0], SALE.notch[1]);
    const impact = interpolate(local, [SALE.release[1], SALE.release[1] + 5, SALE.release[1] + 16], [0, 1, 0], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const costTop = ZERO_Y - COST_H * costGrow;
    const priceTop = ZERO_Y - PRICE_H * priceGrow;
    const detached = drop > 0;
    // Before it breaks off, the leftover is measured off the two bars actually
    // on screen; after, it is a rigid block on one path.
    const pieceH = detached ? REM_H : Math.max(0, priceTop - costTop);
    const pieceTop = detached
      ? BAR_TOP + (ZERO_Y - BAR_TOP) * drop + (FAB_TOP - ZERO_Y) * release
      : costTop;

    return {
      i,
      x: slotX(i),
      costTop,
      costH: COST_H * costGrow,
      priceTop,
      priceH: PRICE_H * priceGrow,
      pieceTop,
      pieceH,
      notch,
      impact,
      flip: ease(frame, flipAt(i), flipAt(i) + 8),
      started: local >= 0,
    };
  });

  const trough = RULE_X1 - RULE_X0;

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* Everything under this line is loss. Claimed early, filled later. */}
          <rect
            x={SLOT_X0 - 26}
            y={snap(ZERO_Y)}
            width={PITCH * (slots - 1) + BAR_W + 52}
            height={REM_H}
            fill={ink}
            opacity={0.04 * lossZone * recede}
          />

          <line
            x1={RULE_X0}
            y1={snap(ZERO_Y)}
            x2={RULE_X0 + trough * ruleDraw}
            y2={snap(ZERO_Y)}
            stroke={ink}
            strokeWidth={3}
            opacity={(dimOpacity + (litOpacity - dimOpacity) * modelLift) * recede}
          />

          {/* The floor the value ends up on. */}
          <line
            x1={RULE_X0}
            y1={snap(FAB_Y)}
            x2={RULE_X0 + trough * floorIn}
            y2={snap(FAB_Y)}
            stroke={fabFlip > 0.5 ? accent : ink}
            strokeWidth={5}
            opacity={dimOpacity + (0.85 - dimOpacity) * Math.max(floorIn * 0.35, fabFlip)}
          />

          {sales.map((s) => (
            <g key={`slot${s.i}`}>
              {/* The slot tick, staggered in before any of them is used. */}
              <line
                x1={s.x + BAR_W / 2}
                y1={snap(ZERO_Y)}
                x2={s.x + BAR_W / 2}
                y2={snap(ZERO_Y) + 14}
                stroke={ink}
                strokeWidth={3}
                opacity={
                  0.3 *
                  ease(frame, beats.slots + s.i * 2, beats.slots + s.i * 2 + 10) *
                  (1 - s.notch) *
                  recede
                }
              />
              {/* What the infra costs — hollow, so the leftover reads as the
                  part the price never covered. */}
              <rect
                x={s.x + 1.5}
                y={s.costTop}
                width={BAR_W - 3}
                height={s.costH}
                fill="none"
                stroke={ink}
                strokeWidth={3}
                opacity={s.costH > 1 ? 0.34 * recede : 0}
              />
              {/* What they charge for it. */}
              <rect
                x={s.x}
                y={s.priceTop + FILL_GAP}
                width={BAR_W}
                height={Math.max(0, s.priceH - FILL_GAP)}
                fill={ink}
                opacity={s.priceH > FILL_GAP ? 0.7 * recede : 0}
              />
              {/* The hole it leaves in the ledger. */}
              <rect
                x={s.x}
                y={snap(ZERO_Y)}
                width={BAR_W}
                height={REM_H}
                fill="none"
                stroke={ink}
                strokeWidth={3}
                opacity={0.42 * s.notch * recede}
              />
            </g>
          ))}

          {/* The leftovers, in flight and at rest. Never receded — they are the
              subject, and they are the only thing that turns accent. */}
          {sales.map((s) => {
            const bottom = s.pieceTop + s.pieceH;
            const squash = `translate(${s.x + BAR_W / 2} ${bottom}) scale(${1 + 0.06 * s.impact} ${
              1 - 0.1 * s.impact
            }) translate(${-(s.x + BAR_W / 2)} ${-bottom})`;
            if (s.pieceH <= 0.5) {
              return null;
            }
            return (
              <g key={`piece${s.i}`} transform={squash}>
                <rect
                  x={s.x}
                  y={s.pieceTop}
                  width={BAR_W}
                  height={s.pieceH}
                  fill={ink}
                  opacity={barOpacity * (1 - s.flip)}
                />
                <rect
                  x={s.x}
                  y={s.pieceTop}
                  width={BAR_W}
                  height={s.pieceH}
                  fill={accent}
                  opacity={s.flip}
                />
              </g>
            );
          })}
        </g>
      </svg>

      <Label
        text={labels.model}
        y={BAR_TOP - 132}
        color={ink}
        opacity={modelLift * (0.35 + 0.65 * recede)}
        shadow={shadow}
        lift={(1 - modelLift) * 14}
      />
      <Label
        text={labels.fab}
        y={FAB_Y + 56}
        color={ink}
        opacity={fabLabelIn * (1 - fabFlip)}
        shadow={shadow}
        lift={(1 - fabLabelIn) * 14}
      />
      <Label
        text={labels.fab}
        y={FAB_Y + 56}
        color={accent}
        opacity={fabLabelIn * fabFlip}
        shadow={shadow}
        lift={0}
      />
    </AbsoluteFill>
  );
};

export default ValueSinksToFabV2;
