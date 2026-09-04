import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 33.020s -> 39.619s of the source cut. Picks up on the frame the previous
// scene ends, so the chart is already standing at frame 0.
export const DURATION = 198;

// Same plot as UnderstandingDepthPlateau — this scene annotates that chart
// rather than drawing a new one.
const PLOT_X0 = 110;
const PLOT_X1 = 970;
const PLOT_Y0 = 400;
const PLOT_Y1 = 1600;
const STRATA = 24;

// The level both parties reach. Pinned to a stratum so the guide lands on a
// layer of the code base instead of 5px away from one.
const MATCH_INDEX = 7;
const MATCH_D = MATCH_INDEX / (STRATA - 1);

const BAR_DY = 30;
const BAR_H = 16;
const TENURE_Y = 1417;
const GAP_W = 12;

const LEGEND_Y = 258;
const LEGEND_DOT = 28;
const LEGEND_GAP = 64;

const px = (x: number) => PLOT_X0 + x * (PLOT_X1 - PLOT_X0);
const py = (d: number) => PLOT_Y0 + d * (PLOT_Y1 - PLOT_Y0);

const LegendItem: React.FC<{color: string; label: string; ink: string}> = ({
  color,
  label,
  ink,
}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
    <div
      style={{
        width: LEGEND_DOT,
        height: LEGEND_DOT,
        borderRadius: LEGEND_DOT / 2,
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontFamily: roboto.fontFamily,
        fontWeight: 700,
        fontSize: 58,
        lineHeight: 1,
        letterSpacing: '0.11em',
        marginRight: '-0.11em',
        whiteSpace: 'nowrap',
        color: ink,
      }}
    >
      {label}
    </span>
  </div>
);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  litOpacity: z.number().min(0).max(1),
  axisOpacity: z.number().min(0).max(1),
  aiDepth: z.number().min(0.1).max(0.9),
  aiRate: z.number().min(2).max(30),
  humanDepth: z.number().min(0.1).max(1),
  humanCurve: z.number().min(0.5).max(3),
  labels: z.object({ai: z.string(), human: z.string()}),
  // Beat frames from the SRT at 30fps, relative to 00:00:33.020:
  //   23 "in an hour" · 38 "can match" · 51 "a human" · 60 "with a few weeks"
  beats: z.object({
    guide: z.number().int(),
    aiSpan: z.number().int(),
    bridge: z.number().int(),
    humanMark: z.number().int(),
    humanSpan: z.number().int(),
    gap: z.number().int(),
    tenure: z.number().int(),
    tenureEnd: z.number().int(),
  }),
});

export type HourVersusWeeksProps = z.infer<typeof schema>;

export const defaultProps: HourVersusWeeksProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.1,
  litOpacity: 0.78,
  axisOpacity: 0.22,
  aiDepth: 0.42,
  aiRate: 11,
  humanDepth: 0.8,
  humanCurve: 1.35,
  labels: {ai: 'AI', human: 'HUMAN'},
  beats: {guide: 8, aiSpan: 23, bridge: 38, humanMark: 51, humanSpan: 60, gap: 99, tenure: 130, tenureEnd: 172},
});

const HourVersusWeeks: React.FC<HourVersusWeeksProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  litOpacity,
  axisOpacity,
  aiDepth,
  aiRate,
  humanDepth,
  humanCurve,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const dAi = (x: number) => aiDepth * (1 - Math.exp(-aiRate * x));
  const dHuman = (x: number) => humanDepth * Math.pow(x, humanCurve);

  // Both curves inverted at the match level: how long each one took to get
  // there. These two numbers are the whole point of the scene.
  const xAiMatch = -Math.log(1 - MATCH_D / aiDepth) / aiRate;
  const xHumanMatch = Math.pow(MATCH_D / humanDepth, 1 / humanCurve);

  const recede = interpolate(frame, [0, 14], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const aiMark = interpolate(frame, [beats.guide + 2, beats.guide + 14], [0, 1], {
    easing: Easing.bezier(0.2, 1.5, 0.4, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const aiSpan = interpolate(frame, [beats.aiSpan, beats.aiSpan + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Reaches across and arrives just as the human marker lands.
  const bridge = interpolate(frame, [beats.bridge, beats.humanMark + 1], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const humanMark = interpolate(frame, [beats.humanMark, beats.humanMark + 11], [0, 1], {
    easing: Easing.bezier(0.2, 1.5, 0.4, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Drawn over twice as many frames as the model's span, on top of being four
  // times as long — the duration is encoded twice.
  const humanSpan = interpolate(frame, [beats.humanSpan, beats.humanSpan + 22], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const land = interpolate(frame, [beats.humanSpan + 22, beats.humanSpan + 30, beats.humanSpan + 46], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The first comparison is made; it steps back rather than competing with the
  // second one.
  const settleBack = interpolate(frame, [beats.gap - 4, beats.gap + 18], [1, 0.45], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gapGrow = interpolate(frame, [beats.gap, beats.gap + 23], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tenureSpan = interpolate(frame, [beats.tenure, beats.tenureEnd], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tenureLand = interpolate(
    frame,
    [beats.tenureEnd - 2, beats.tenureEnd + 8, beats.tenureEnd + 26],
    [0, 1, 0],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const guideY = Math.round(py(MATCH_D)) + 0.5;
  const aiEndY = py(dAi(1));
  const humanEndY = py(dHuman(1));

  const traceFor = (fn: (x: number) => number) => {
    const N = 72;
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      pts.push(`${i === 0 ? 'M' : 'L'}${px(x).toFixed(2)} ${py(fn(x)).toFixed(2)}`);
    }
    return pts.join(' ');
  };

  const Span: React.FC<{
    color: string;
    xEnd: number;
    y: number;
    capTo: number;
    p: number;
  }> = ({color, xEnd, y, capTo, p}) => {
    const w = (px(xEnd) - px(0)) * p;
    return (
      <g opacity={p > 0 ? 1 : 0}>
        <rect
          x={px(0)}
          y={y - BAR_H / 2}
          width={Math.max(w, 0)}
          height={BAR_H}
          rx={BAR_H / 2}
          fill={color}
        />
        <line
          x1={px(0) + w}
          y1={y}
          x2={px(0) + w}
          y2={capTo}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={p}
        />
      </g>
    );
  };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: LEGEND_Y,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: LEGEND_GAP,
          filter: `drop-shadow(0 2px 6px ${shadow})`,
        }}
      >
        <LegendItem color={accent} label={labels.ai} ink={ink} />
        <LegendItem color={ink} label={labels.human} ink={ink} />
      </div>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The settled state the previous scene ended on. */}
          {Array.from({length: STRATA}, (_, i) => {
            const depth = i / (STRATA - 1);
            const lit = depth <= humanDepth;
            const settled = lit ? litOpacity : dimOpacity * 1.6;
            return (
              <line
                key={`s${i}`}
                x1={PLOT_X0}
                y1={Math.round(py(depth)) + 0.5}
                x2={PLOT_X1}
                y2={Math.round(py(depth)) + 0.5}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={settled + ((lit ? 0.24 : 0.07) - settled) * recede}
              />
            );
          })}

          <line
            x1={PLOT_X0}
            y1={PLOT_Y0 - 26}
            x2={PLOT_X0}
            y2={PLOT_Y1 + 26}
            stroke={ink}
            strokeWidth={2}
            opacity={axisOpacity}
          />

          <path
            d={traceFor(dHuman)}
            fill="none"
            stroke={ink}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={traceFor(dAi)}
            fill="none"
            stroke={accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle cx={px(1)} cy={py(dHuman(1))} r={14} fill={ink} />
          <circle cx={px(1)} cy={py(dAi(1))} r={14} fill={accent} />

          <g opacity={settleBack}>
          {/* "can match": reaches from one arrival point to the other. */}
          <line
            x1={px(xAiMatch)}
            y1={guideY}
            x2={px(xAiMatch) + (px(xHumanMatch) - px(xAiMatch)) * bridge}
            y2={guideY}
            stroke={ink}
            strokeWidth={2.5}
            strokeDasharray="12 10"
            opacity={bridge > 0 ? 0.6 : 0}
          />

          <Span color={accent} xEnd={xAiMatch} y={guideY - BAR_DY} capTo={guideY} p={aiSpan} />
          <Span color={ink} xEnd={xHumanMatch} y={guideY + BAR_DY} capTo={guideY} p={humanSpan} />

          <circle
            cx={px(xAiMatch)}
            cy={guideY}
            r={16 * aiMark + 30 * land}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            opacity={0.5 * land}
          />
          <circle
            cx={px(xHumanMatch)}
            cy={guideY}
            r={16 * humanMark + 30 * land}
            fill="none"
            stroke={ink}
            strokeWidth={2}
            opacity={0.5 * land}
          />
          <circle cx={px(xAiMatch)} cy={guideY} r={16 * aiMark} fill={accent} />
          <circle cx={px(xHumanMatch)} cy={guideY} r={16 * humanMark} fill={ink} />
          </g>

          {/* "it won't match": the shortfall, measured between the two ends at
              the same point in time. The first half measured across, this one
              measures down. */}
          <rect
            x={px(1) - GAP_W / 2}
            y={aiEndY}
            width={GAP_W}
            height={Math.max((humanEndY - aiEndY) * gapGrow, 0)}
            rx={GAP_W / 2}
            fill={ink}
            opacity={0.9 * (gapGrow > 0 ? 1 : 0)}
          />

          {/* "for like two years": the whole axis. */}
          <Span color={ink} xEnd={1} y={TENURE_Y} capTo={humanEndY} p={tenureSpan} />

          <circle
            cx={px(1)}
            cy={humanEndY}
            r={14 + 34 * tenureLand}
            fill="none"
            stroke={ink}
            strokeWidth={2}
            opacity={0.5 * tenureLand}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default HourVersusWeeks;
