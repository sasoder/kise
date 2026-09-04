import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:04.219 -> 00:00:20.320 of the source cut. "you've got the end user"
// through "massive positive gross margins".
export const DURATION = 483;

// One zero axis, drawn first, that every row is measured against. Positive
// value runs right of it, negative left.
const AXIS_X = 380;
const POS_SPAN = 610; // AXIS_X -> 990
const NEG_SPAN = 290; // AXIS_X -> 90
const AXIS_Y0 = 470;
const AXIS_Y1 = 1452;

const BAR_H = 56;
const LABEL_TOP = [520, 880, 1240];
const BAR_Y = [602, 962, 1322];
const BAR_MID = BAR_Y.map((y) => y + BAR_H / 2);

const LABEL_SIZE = 58;

const ease = (
  frame: number,
  from: number,
  to: number,
  easing: (t: number) => number,
) =>
  interpolate(frame, [from, to], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Label: React.FC<{
  text: string;
  top: number;
  color: string;
  p: number;
  opacity: number;
  shadow: string;
}> = ({text, top, color, p, opacity, shadow}) => (
  <div
    style={{
      position: 'absolute',
      left: AXIS_X,
      top,
      fontFamily: roboto.fontFamily,
      fontWeight: 700,
      fontSize: LABEL_SIZE,
      lineHeight: 1,
      letterSpacing: '0.11em',
      marginRight: '-0.11em',
      whiteSpace: 'nowrap',
      color,
      opacity: p * opacity,
      transform: `translateY(${(1 - p) * 16}px)`,
      filter: `drop-shadow(0 2px 6px ${shadow})`,
    }}
  >
    {text}
  </div>
);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  axisOpacity: z.number().min(0).max(1),
  inkOpacity: z.number().min(0).max(1),
  guideOpacity: z.number().min(0).max(1),
  recedeOpacity: z.number().min(0).max(1),
  labels: z.object({user: z.string(), app: z.string(), model: z.string()}),
  // Fractions of their own span, so retiming or resizing keeps the ratios.
  values: z.object({
    user: z.number().min(0).max(1),
    app: z.number().min(0).max(1),
    negative: z.number().min(0).max(1),
    model: z.number().min(0).max(1),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:04.219:
  //   0 "you've got" · 11 "the end user" · 91 "more value than" ·
  //   158 "a lot for these models" · 211 "the app layer" ·
  //   258 "generated very little value" · 297 "the model layer" ·
  //   356 "a year ago was generating" · 392 "margins" · 405 "and is now" ·
  //   434 "massive" · 466 "margins"
  beats: z.object({
    axis: z.number().int(),
    userRow: z.number().int(),
    userGrow: z.number().int(),
    guide: z.number().int(),
    appRow: z.number().int(),
    appBar: z.number().int(),
    modelRow: z.number().int(),
    modelNeg: z.number().int(),
    negEnd: z.number().int(),
    flip: z.number().int(),
    modelPos: z.number().int(),
    settle: z.number().int(),
  }),
});

export type ValueCaptureStackProps = z.infer<typeof schema>;

export const defaultProps: ValueCaptureStackProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  axisOpacity: 0,
  inkOpacity: 0.92,
  guideOpacity: 0,
  recedeOpacity: 0.68,
  labels: {user: 'END USER', app: 'APP LAYER', model: 'MODEL LAYER'},
  values: {user: 0.82, app: 0.14, negative: 0.79, model: 0.7},
  beats: {
    axis: 0,
    userRow: 11,
    userGrow: 91,
    guide: 158,
    appRow: 211,
    appBar: 258,
    modelRow: 297,
    modelNeg: 356,
    negEnd: 392,
    flip: 405,
    modelPos: 434,
    settle: 466,
  },
});

const ValueCaptureStack: React.FC<ValueCaptureStackProps> = ({
  ink,
  accent,
  shadow,
  axisOpacity,
  inkOpacity,
  guideOpacity,
  recedeOpacity,
  labels,
  values,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const axisX = Math.round(AXIS_X) + 0.5;

  const axisDraw = ease(frame, beats.axis, beats.axis + 18, Easing.inOut(Easing.cubic));

  const userLabel = ease(frame, beats.userRow, beats.userRow + 12, Easing.out(Easing.cubic));
  // Two moves: the row arrives, then "more value than anyone else" pushes it
  // out to its full width.
  const userSeed = ease(frame, beats.userRow + 3, beats.userRow + 24, Easing.out(Easing.cubic));
  const userPush = ease(frame, beats.userGrow, beats.userGrow + 26, Easing.inOut(Easing.cubic));
  const userW = POS_SPAN * values.user * (0.55 * userSeed + 0.45 * userPush);

  // The yardstick: what the end user generates, dropped down the frame so the
  // two layers below are read against it rather than against nothing.
  const guide = ease(frame, beats.guide, beats.guide + 22, Easing.out(Easing.cubic));
  const guideLand = interpolate(
    frame,
    [beats.guide, beats.guide + 12, beats.guide + 30],
    [0, 1, 0],
    {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const appLabel = ease(frame, beats.appRow, beats.appRow + 12, Easing.out(Easing.cubic));
  // Creeps. The one bar in the piece that is slow because it is small.
  const appGrow = ease(frame, beats.appBar, beats.appBar + 24, Easing.out(Easing.quad));
  const appW = POS_SPAN * values.app * appGrow;

  const modelLabel = ease(frame, beats.modelRow, beats.modelRow + 12, Easing.out(Easing.cubic));
  const negGrow = ease(frame, beats.modelNeg, beats.negEnd, Easing.inOut(Easing.cubic));
  const retract = ease(frame, beats.flip, beats.flip + 15, Easing.in(Easing.cubic));
  const negW = NEG_SPAN * values.negative * negGrow * (1 - retract);

  // Overshoots exactly onto the end-user guide, then settles back under it.
  const posP = interpolate(
    frame,
    [beats.modelPos, beats.settle - 4, beats.settle + 10],
    [0, 1.17, 1],
    {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const modelW = POS_SPAN * values.model * posP;

  // The moment the bar reaches the yardstick.
  const hit = interpolate(
    frame,
    [beats.settle - 10, beats.settle - 4, beats.settle + 20],
    [0, 1, 0],
    {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // The first two rows step back so the flip owns the frame, but stay legible
  // enough to keep the comparison alive.
  const recede = interpolate(frame, [beats.flip - 12, beats.flip + 18], [1, recedeOpacity], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const modelColor = interpolateColors(
    interpolate(frame, [beats.modelPos, beats.modelPos + 16], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    [0, 1],
    [ink, accent],
  );

  const guideX = Math.round(AXIS_X + POS_SPAN * values.user) + 0.5;
  const guideY1 = AXIS_Y1 * guide + BAR_MID[0] * (1 - guide);

  return (
    <AbsoluteFill>
      <Label
        text={labels.user}
        top={LABEL_TOP[0]}
        color={ink}
        p={userLabel}
        opacity={inkOpacity * recede}
        shadow={shadow}
      />
      <Label
        text={labels.app}
        top={LABEL_TOP[1]}
        color={ink}
        p={appLabel}
        opacity={inkOpacity * recede}
        shadow={shadow}
      />
      <Label
        text={labels.model}
        top={LABEL_TOP[2]}
        color={modelColor}
        p={modelLabel}
        opacity={inkOpacity}
        shadow={shadow}
      />

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          <line
            x1={axisX}
            y1={AXIS_Y0}
            x2={axisX}
            y2={AXIS_Y0 + (AXIS_Y1 - AXIS_Y0) * axisDraw}
            stroke={ink}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={axisOpacity}
          />

          {/* END USER — the value being generated. */}
          <rect
            x={axisX}
            y={BAR_Y[0]}
            width={Math.max(userW, 0)}
            height={BAR_H}
            rx={BAR_H / 2}
            fill={ink}
            opacity={inkOpacity * recede * (userW > 1 ? 1 : 0)}
          />
          <circle
            cx={guideX}
            cy={BAR_MID[0]}
            r={BAR_H / 2 + 26 * guideLand}
            fill="none"
            stroke={ink}
            strokeWidth={2.5}
            opacity={0.5 * guideLand}
          />

          {/* "hence they're paying a lot for these models" — the yardstick. */}
          <line
            x1={guideX}
            y1={BAR_MID[0]}
            x2={guideX}
            y2={guideY1}
            stroke={ink}
            strokeWidth={3}
            strokeDasharray="10 16"
            strokeLinecap="round"
            opacity={guideOpacity * (1 + hit) * (guide > 0 ? 1 : 0)}
          />

          {/* APP LAYER — barely off the axis. */}
          <rect
            x={axisX}
            y={BAR_Y[1]}
            width={Math.max(appW, 0)}
            height={BAR_H}
            rx={BAR_H / 2}
            fill={ink}
            opacity={inkOpacity * recede * (appW > 1 ? 1 : 0)}
          />

          {/* MODEL LAYER — negative first, hollow, on the wrong side of zero. */}
          <rect
            x={axisX - negW}
            y={BAR_Y[2]}
            width={Math.max(negW, 0)}
            height={BAR_H}
            rx={BAR_H / 2}
            fill="none"
            stroke={ink}
            strokeWidth={3.5}
            strokeDasharray="16 13"
            opacity={0.55 * (negW > 2 ? 1 : 0)}
          />

          {/* ...then across zero and into the accent. */}
          <rect
            x={axisX}
            y={BAR_Y[2]}
            width={Math.max(modelW, 0)}
            height={BAR_H}
            rx={BAR_H / 2}
            fill={accent}
            opacity={modelW > 1 ? 1 : 0}
          />
          <circle
            cx={guideX}
            cy={BAR_MID[2]}
            r={BAR_H / 2 + 30 * hit}
            fill="none"
            stroke={accent}
            strokeWidth={2.5}
            opacity={0.55 * hit}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ValueCaptureStack;
