import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 23.420s -> 33.020s of the source cut.
export const DURATION = 288;

// ---------------------------------------------------------------------------
// Depth of understanding against time. Down is deeper, right is later — which
// is why the material below is drawn as full-width strata rather than as the
// code bars of the previous scene: on a time axis, anything with horizontal
// extent reads as a duration.
// ---------------------------------------------------------------------------
const PLOT_X0 = 110;
const PLOT_X1 = 970;
const PLOT_Y0 = 400;
const PLOT_Y1 = 1600;
const STRATA = 24;

// Legend. Both entries stand from the start, so the row is a plain centred pair.
const LEGEND_Y = 258;
const LEGEND_DOT = 28;
const LEGEND_GAP = 64;

const px = (x: number) => PLOT_X0 + x * (PLOT_X1 - PLOT_X0);
const py = (d: number) => PLOT_Y0 + d * (PLOT_Y1 - PLOT_Y0);

const LegendItem: React.FC<{
  color: string;
  label: string;
  ink: string;
}> = ({color, label, ink}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 26,
      flexShrink: 0,
    }}
  >
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
        // Tracking adds a trailing space after the last glyph, which would
        // throw the pairing off centre.
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
  // Unread strata, revealed strata, and the surrounding rules.
  dimOpacity: z.number().min(0).max(1),
  litOpacity: z.number().min(0).max(1),
  axisOpacity: z.number().min(0).max(1),
  // The model saturates: depth = aiDepth * (1 - e^-aiRate * t). A high rate is
  // what makes the curve read as a plateau rather than as a slow climb.
  aiDepth: z.number().min(0.1).max(0.9),
  aiRate: z.number().min(2).max(30),
  // The human is a power curve — nearly straight, sagging slightly, so it only
  // pays off at the far end of the axis.
  humanDepth: z.number().min(0.1).max(1),
  humanCurve: z.number().min(0.5).max(3),
  labels: z.object({ai: z.string(), human: z.string()}),
  // Beat frames from the SRT at 30fps, relative to 00:00:23.420:
  //   63 "very fast" · 143 "plateau" · 176 "won't get" · 220 "as a human"
  beats: z.object({
    aiStart: z.number().int(),
    probeStart: z.number().int(),
    humanStart: z.number().int(),
    humanEnd: z.number().int(),
  }),
});

export type UnderstandingDepthPlateauProps = z.infer<typeof schema>;

export const defaultProps: UnderstandingDepthPlateauProps = schema.parse({
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
  beats: {aiStart: 40, probeStart: 168, humanStart: 185, humanEnd: 277},
});

const UnderstandingDepthPlateau: React.FC<UnderstandingDepthPlateauProps> = ({
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
  const {width, height, durationInFrames} = useVideoConfig();
  const {aiStart, probeStart, humanStart, humanEnd} = beats;

  const dAi = (x: number) => aiDepth * (1 - Math.exp(-aiRate * x));
  const dHuman = (x: number) => humanDepth * Math.pow(x, humanCurve);

  // The model's clock runs the whole width: it holds its shallow depth for all
  // the time the human spends going deeper, which is the comparison.
  const xAi = interpolate(frame, [aiStart, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const xHuman = interpolate(frame, [humanStart, humanEnd], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const aiNow = dAi(xAi);
  const humanNow = xHuman > 0 ? dHuman(xHuman) : 0;
  const litDepth = Math.max(aiNow, humanNow);

  // Once the line has flattened, the unreached depth below it gains presence —
  // the frame starts to be about what is missing.
  const reveal = interpolate(frame, [probeStart - 8, probeStart + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const traceFor = (fn: (x: number) => number, xEnd: number) => {
    if (xEnd <= 0) return '';
    const N = 72;
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * xEnd;
      pts.push(`${i === 0 ? 'M' : 'L'}${px(x).toFixed(2)} ${py(fn(x)).toFixed(2)}`);
    }
    return pts.join(' ');
  };

  const land = interpolate(frame, [humanEnd - 2, humanEnd + 7, humanEnd + 26], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const legendIn = interpolate(frame, [12, 30], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
          opacity: legendIn,
          filter: `drop-shadow(0 2px 6px ${shadow})`,
        }}
      >
        <LegendItem color={accent} label={labels.ai} ink={ink} />
        <LegendItem color={ink} label={labels.human} ink={ink} />
      </div>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* Layers of the code base. Everything above the deepest point
              reached is understood; everything below it is not. */}
          {Array.from({length: STRATA}, (_, i) => {
            const depth = i / (STRATA - 1);
            const litP = interpolate(litDepth - depth, [0, 0.022], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const base = dimOpacity * (1 + 0.6 * reveal * (1 - litP));
            // The stack is laid down top-first, so the opening establishes a
            // deep code base before anything starts reading it.
            const enter = interpolate(frame, [i * 1.15, i * 1.15 + 14], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const y = Math.round(py(depth)) + 0.5 - (1 - enter) * 9;
            return (
              <line
                key={`s${i}`}
                x1={PLOT_X0}
                y1={y}
                x2={PLOT_X1}
                y2={y}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={(base + (litOpacity - base) * litP) * enter}
              />
            );
          })}

          {/* Depth axis. The only rule in the frame, so down reads as a scale. */}
          <line
            x1={PLOT_X0}
            y1={PLOT_Y0 - 26}
            x2={PLOT_X0}
            y2={PLOT_Y1 + 26}
            stroke={ink}
            strokeWidth={2}
            opacity={
              axisOpacity *
              interpolate(frame, [0, 16], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            }
          />

          {/* It keeps trying to go deeper and keeps coming back up. */}
          {[0, 1, 2].map((i) => {
            const at = probeStart + i * 12;
            const q = interpolate(frame, [at, at + 13], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            if (q <= 0 || q >= 1) return null;
            const reach = Math.sin(Math.PI * q);
            const x = px(interpolate(at, [aiStart, durationInFrames], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }));
            const top = py(dAi(1)) + 10;
            return (
              <line
                key={`p${i}`}
                x1={x}
                y1={top}
                x2={x}
                y2={top + 112 * reach}
                stroke={accent}
                strokeWidth={5}
                strokeLinecap="round"
                opacity={0.85 * reach}
              />
            );
          })}

          <path
            d={traceFor(dHuman, xHuman)}
            fill="none"
            stroke={ink}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={traceFor(dAi, xAi)}
            fill="none"
            stroke={accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {xHuman > 0 ? (
            <g>
              <circle
                cx={px(xHuman)}
                cy={py(humanNow)}
                r={14 + 34 * land}
                fill="none"
                stroke={ink}
                strokeWidth={2}
                opacity={0.5 * land}
              />
              <circle cx={px(xHuman)} cy={py(humanNow)} r={14} fill={ink} />
            </g>
          ) : null}
          <circle cx={px(xAi)} cy={py(aiNow)} r={14} fill={accent} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default UnderstandingDepthPlateau;
