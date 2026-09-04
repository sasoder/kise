import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:26.820 -> 00:00:32.820 of the source cut.
export const DURATION = 180;

// ---------------------------------------------------------------------------
// Square cut of the same argument. The vertical version stacked the capability
// plot above the revenue column; at 1:1 that stack has nowhere to go, so the
// two panels sit side by side on one shared ground line instead — which reads
// better anyway, because the column is now level with the wedge it is measuring
// and the eye carries the height straight across.
//
// Left: capability against time. The frontier lab's released line climbs, then
// is capped — held back, not overtaken, so a dashed ghost keeps rising above
// it. The field climbs the whole clip. The cyan wedge between them IS the
// differentiation.
//
// Right: the ground line becomes a fraction. Revenue stacks above it — a
// constant ink base (commodity) plus an accent premium whose height is read
// straight off the wedge — and the one megawatt earning it hangs below,
// never changing size.
//
// The cause is spoken after the effect, so the field stays at dimOpacity until
// "because" and the collapse is explained in retrospect.
// ---------------------------------------------------------------------------
const PLOT_X0 = 90;
const PLOT_X1 = 660;
const CAP_Y0 = 200; // capability 1.0
const BASELINE = 820; // capability 0, and the ground both panels stand on

const LEGEND_Y = 56;
const LEGEND_DOT = 28;
const LEGEND_GAP = 64;

const COL_X = 775;
const COL_W = 150;
const SQ_TOP = 836;
const SQ_SIZE = 150;

// The caption sits in the space the plot leaves under its own axis, right
// aligned into the gutter so it reads straight into the megawatt square.
const CAPTION_RIGHT = 730;
const CAPTION_Y1 = 845;
const CAPTION_Y2 = 911;
const FONT_SIZE = 58;

const TRACE_STEPS = 72;

// Bolt drawn in the megawatt square's own unit box, so it scales with it.
const BOLT = [
  [0.56, 0.1],
  [0.3, 0.55],
  [0.47, 0.55],
  [0.42, 0.9],
  [0.7, 0.44],
  [0.53, 0.44],
];

const py = (c: number) => BASELINE - c * (BASELINE - CAP_Y0);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const TYPE: React.CSSProperties = {
  fontFamily: roboto.fontFamily,
  fontWeight: 700,
  fontSize: FONT_SIZE,
  lineHeight: 1,
  letterSpacing: '0.11em',
  // Tracking adds a trailing space after the last glyph, which would throw both
  // the centred legend pair and the right-aligned caption off their edge.
  marginRight: '-0.11em',
  whiteSpace: 'nowrap',
};

const LegendItem: React.FC<{
  color: string;
  label: string;
  ink: string;
  opacity: number;
}> = ({color, label, ink, opacity}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 26, flexShrink: 0, opacity}}>
    <div
      style={{
        width: LEGEND_DOT,
        height: LEGEND_DOT,
        borderRadius: LEGEND_DOT / 2,
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
    <span style={{...TYPE, color: ink}}>{label}</span>
  </div>
);

const CaptionLine: React.FC<{
  top: number;
  text: string;
  ink: string;
  shadow: string;
  enter: number;
}> = ({top, text, ink, shadow, enter}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: 0,
      width: CAPTION_RIGHT,
      display: 'flex',
      justifyContent: 'flex-end',
      opacity: 0.92 * enter,
      transform: `translateX(${(1 - enter) * -14}px)`,
      filter: `drop-shadow(0 2px 6px ${shadow})`,
    }}
  >
    <span style={{...TYPE, color: ink}}>{text}</span>
  </div>
);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // The released frontier line: climbs, then is capped at leadCap and held.
  leadStart: z.number().min(0).max(1),
  leadCap: z.number().min(0).max(1),
  // The field: flat while the leader opens the gap, then an accelerating catch-up.
  fieldFloor: z.number().min(0).max(1),
  fieldEnd: z.number().min(0).max(1),
  // Normalised progress of the field from floor to end at each beat stop:
  // [0, stall, declineStart, because, converge, end]. Monotone by construction,
  // so the field can never overtake — he says competitive, not ahead.
  fieldShape: z.array(z.number().min(0).max(1)).length(6),
  // How far the withheld model keeps climbing above the capped release line.
  ghostRise: z.number().min(0).max(0.4),
  dimOpacity: z.number().min(0).max(1),
  litOpacity: z.number().min(0).max(1),
  wedgeOpacity: z.number().min(0).max(1),
  axisOpacity: z.number().min(0).max(1),
  // Pixels of column height per unit of capability gap, plus the commodity base
  // that survives after the premium is competed away.
  premiumScale: z.number().min(100).max(900),
  baseHeight: z.number().min(0).max(400),
  labels: z.object({
    frontier: z.string(),
    field: z.string(),
    revenue: z.string(),
    megawatt: z.string(),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:26.820:
  //   15 "their revenue" · 32 "per megawatt" · 51 "stalls or even" ·
  //   90 "can start" · 102 "to decline" · 116 "again because" · 167 "competitive"
  beats: z.object({
    revenue: z.number().int(),
    megawatt: z.number().int(),
    stall: z.number().int(),
    declineStart: z.number().int(),
    decline: z.number().int(),
    because: z.number().int(),
    converge: z.number().int(),
  }),
});

export type RevenuePerMegawattStallSquareProps = z.infer<typeof schema>;

export const defaultProps: RevenuePerMegawattStallSquareProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  leadStart: 0.55,
  leadCap: 0.82,
  fieldFloor: 0.22,
  fieldEnd: 0.8,
  fieldShape: [0, 0, 0.026, 0.172, 0.957, 1],
  ghostRise: 0.16,
  dimOpacity: 0.1,
  litOpacity: 0.88,
  wedgeOpacity: 0.3,
  axisOpacity: 0.26,
  premiumScale: 620,
  baseHeight: 70,
  labels: {
    frontier: 'FRONTIER',
    field: 'THE FIELD',
    revenue: 'REVENUE',
    megawatt: 'PER MEGAWATT',
  },
  beats: {
    revenue: 15,
    megawatt: 32,
    stall: 51,
    declineStart: 90,
    decline: 102,
    because: 116,
    converge: 167,
  },
});

const RevenuePerMegawattStallSquare: React.FC<RevenuePerMegawattStallSquareProps> = ({
  ink,
  accent,
  shadow,
  leadStart,
  leadCap,
  fieldFloor,
  fieldEnd,
  fieldShape,
  ghostRise,
  dimOpacity,
  litOpacity,
  wedgeOpacity,
  axisOpacity,
  premiumScale,
  baseHeight,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const {revenue, megawatt, stall, declineStart, decline, because, converge} = beats;

  const px = (f: number) => PLOT_X0 + (f / durationInFrames) * (PLOT_X1 - PLOT_X0);

  // Released capability. Rises, then is capped — this is a release decision,
  // not a loss of progress, so the curve settles rather than rolling over.
  const cLead = (f: number) =>
    interpolate(f, [0, stall], [leadStart, leadCap], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const cField = (f: number) =>
    fieldFloor +
    (fieldEnd - fieldFloor) *
      interpolate(f, [0, stall, declineStart, because, converge, durationInFrames], fieldShape, {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // What they are sitting on and not shipping.
  const cGhost = (f: number) =>
    cLead(f) + ghostRise * Math.pow(clamp01((f - stall) / (durationInFrames - stall)), 0.85);

  // Two trailing models, lagged and offset so the field reads as plural.
  const FOLLOWERS = [
    {lag: 12, drop: 0.065, max: 0.34},
    {lag: 24, drop: 0.115, max: 0.25},
  ];

  const trace = (fn: (f: number) => number, fromF: number, toF: number) => {
    if (toF - fromF < 0.5) return '';
    const pts: string[] = [];
    for (let i = 0; i <= TRACE_STEPS; i++) {
      const f = fromF + (i / TRACE_STEPS) * (toF - fromF);
      pts.push(`${i === 0 ? 'M' : 'L'}${px(f).toFixed(2)} ${py(fn(f)).toFixed(2)}`);
    }
    return pts.join(' ');
  };

  const wedgePath = () => {
    if (frame < 1) return '';
    const top: string[] = [];
    const bottom: string[] = [];
    for (let i = 0; i <= TRACE_STEPS; i++) {
      const f = (i / TRACE_STEPS) * frame;
      top.push(`${i === 0 ? 'M' : 'L'}${px(f).toFixed(2)} ${py(cLead(f)).toFixed(2)}`);
      bottom.push(`L${px(f).toFixed(2)} ${py(cField(f)).toFixed(2)}`);
    }
    return `${top.join(' ')} ${bottom.reverse().join(' ')} Z`;
  };

  // The premium is the gap. Nothing else feeds the column.
  const gapNow = cLead(frame) - cField(frame);

  const emerge = interpolate(frame, [revenue, revenue + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const baseH = baseHeight * emerge;
  const premH = Math.max(0, gapNow) * premiumScale * emerge;

  // High-water mark, computed from the curves rather than captured, so it
  // stays put if the beats are retimed.
  const peakY = Math.round(BASELINE - (baseHeight + (leadCap - fieldFloor) * premiumScale)) + 0.5;
  const peakIn = interpolate(frame, [decline - 3, decline + 14], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sqIn = interpolate(frame, [megawatt - 4, megawatt + 14], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sqPulse = interpolate(frame, [megawatt, megawatt + 10, megawatt + 30], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const land = interpolate(frame, [converge - 2, converge + 7, converge + 12], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fieldLit = interpolate(frame, [because - 3, because + 15], [dimOpacity, litOpacity], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const legendIn = interpolate(frame, [2, 18], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ghostIn = interpolate(frame, [stall - 4, stall + 20], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leadPath = trace(cLead, 0, frame);
  const groundY = Math.round(BASELINE) + 0.5;
  const bolt = BOLT.map(([bx, by]) => `${COL_X + bx * SQ_SIZE},${SQ_TOP + by * SQ_SIZE}`).join(' ');

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
        <LegendItem color={accent} label={labels.frontier} ink={ink} opacity={1} />
        <LegendItem
          color={ink}
          label={labels.field}
          ink={ink}
          opacity={interpolate(fieldLit, [dimOpacity, litOpacity], [0.3, 1])}
        />
      </div>

      <CaptionLine
        top={CAPTION_Y1}
        text={labels.revenue}
        ink={ink}
        shadow={shadow}
        enter={emerge}
      />
      <CaptionLine
        top={CAPTION_Y2}
        text={labels.megawatt}
        ink={ink}
        shadow={shadow}
        enter={sqIn}
      />

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* Capability axis, then the ground both panels share. Two segments
              rather than one rule, so the column reads as its own panel. */}
          <line
            x1={PLOT_X0}
            y1={CAP_Y0 - 20}
            x2={PLOT_X0}
            y2={BASELINE + 24}
            stroke={ink}
            strokeWidth={2}
            opacity={axisOpacity}
          />
          <line
            x1={PLOT_X0 - 12}
            y1={groundY}
            x2={PLOT_X1 + 20}
            y2={groundY}
            stroke={ink}
            strokeWidth={3}
            opacity={axisOpacity}
          />
          <line
            x1={COL_X - 40}
            y1={groundY}
            x2={COL_X + COL_W + 40}
            y2={groundY}
            stroke={ink}
            strokeWidth={3}
            opacity={axisOpacity}
          />

          {/* The premium. Its lower edge is the field, which is why the wedge
              is visibly eaten well before anything explains what is eating it. */}
          <path d={wedgePath()} fill={accent} opacity={wedgeOpacity} stroke="none" />

          {/* Held back, not overtaken. */}
          {frame > stall - 4 ? (
            <path
              d={trace(cGhost, stall, Math.max(stall, frame))}
              fill="none"
              stroke={accent}
              strokeWidth={4}
              strokeDasharray="10 14"
              strokeLinecap="round"
              opacity={0.3 * ghostIn}
            />
          ) : null}

          {FOLLOWERS.map((f, i) => (
            <path
              key={`f${i}`}
              d={trace((t) => cField(Math.max(0, t - f.lag)) - f.drop, 0, frame)}
              fill="none"
              stroke={ink}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={interpolate(
                frame,
                [because + 6 * (i + 1), because + 24 + 6 * i],
                [dimOpacity, f.max],
                {
                  easing: Easing.out(Easing.cubic),
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                },
              )}
            />
          ))}

          <path
            d={trace(cField, 0, frame)}
            fill="none"
            stroke={ink}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={fieldLit}
          />

          <path
            d={leadPath}
            fill="none"
            stroke={accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Heads. */}
          {frame > 0 ? (
            <>
              <circle cx={px(frame)} cy={py(cField(frame))} r={13} fill={ink} opacity={fieldLit} />
              <circle cx={px(frame)} cy={py(cLead(frame))} r={14} fill={accent} />
              <circle
                cx={px(frame)}
                cy={(py(cLead(frame)) + py(cField(frame))) / 2}
                r={16 + 52 * land}
                fill="none"
                stroke={ink}
                strokeWidth={2}
                opacity={0.5 * land}
              />
            </>
          ) : null}

          {/* Where the column stood at peak differentiation. */}
          <line
            x1={COL_X - 40}
            y1={peakY}
            x2={COL_X + COL_W + 40}
            y2={peakY}
            stroke={ink}
            strokeWidth={3}
            strokeDasharray="8 11"
            opacity={0.45 * peakIn}
          />

          {/* Revenue: commodity base plus the premium, which is the wedge. */}
          <rect
            x={COL_X}
            y={BASELINE - baseH}
            width={COL_W}
            height={baseH}
            fill={ink}
            opacity={0.7}
          />
          <rect
            x={COL_X}
            y={BASELINE - baseH - premH}
            width={COL_W}
            height={premH}
            fill={accent}
            opacity={0.95}
          />

          {/* One megawatt, hanging below the line it is divided into. Never
              changes size — that is the whole point. */}
          <g opacity={sqIn} transform={`translate(0 ${(1 - sqIn) * 18})`}>
            <rect
              x={COL_X}
              y={SQ_TOP}
              width={SQ_SIZE}
              height={SQ_SIZE}
              fill="none"
              stroke={ink}
              strokeWidth={4}
              opacity={0.75}
            />
            <polygon points={bolt} fill={ink} opacity={0.58} />
            <circle
              cx={COL_X + SQ_SIZE / 2}
              cy={SQ_TOP + SQ_SIZE / 2}
              r={80 + 34 * sqPulse}
              fill="none"
              stroke={ink}
              strokeWidth={2}
              opacity={0.4 * sqPulse}
            />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default RevenuePerMegawattStallSquare;
