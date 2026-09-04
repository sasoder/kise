import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:39.719 -> 00:00:47.539 of the source cut.
export const DURATION = 235;

// ---------------------------------------------------------------------------
// Continues the previous scene. The ground line is still a fraction bar and the
// one megawatt still hangs below it, but now there are two revenue columns
// standing on it: theirs and everyone else's.
//
// "Does not climb as fast" is a claim about rate, so rate is drawn: each column
// drops a tick at a fixed frame interval, at whatever height it had reached.
// The accent ticks crowd together as it saturates; the ink ticks spread apart
// as it accelerates. Same interval, opposite rhythm — the argument is legible
// from the tick spacing alone.
//
// The band on the right is how much more they can pay for the incremental
// megawatt than everyone else. It is bounded by the two column tops, so it can
// only report what the columns are already doing. It peaks, then diminishes.
// ---------------------------------------------------------------------------
const GROUND = 660;
const SCALE = 480; // pixels per unit of revenue per megawatt

const LEAD_X = 300;
const FIELD_X = 540;
const COL_W = 150;

// Rate ticks sit outside each column so they never fight the fill they measure,
// and both on the left so the two rulers read as one instrument.
const LEAD_TICK_X1 = 262;
const LEAD_TICK_X2 = 290;
const FIELD_TICK_X1 = 500;
const FIELD_TICK_X2 = 528;

// The band butts up against the field column, so its lower edge continues that
// column's top rather than floating away from it.
const BAND_X1 = 706;
const BAND_X2 = 836;

const MW_X = 420;
const MW_TOP = 676;
const MW_SIZE = 150;

const LEGEND_Y = 50;
const LEGEND_DOT = 28;
const LEGEND_GAP = 64;

const CAPTION_CENTER = 495;
const CAPTION_Y1 = 852;
const CAPTION_Y2 = 918;
const FONT_SIZE = 58;

const BOLT = [
  [0.56, 0.1],
  [0.3, 0.55],
  [0.47, 0.55],
  [0.42, 0.9],
  [0.7, 0.44],
  [0.53, 0.44],
];

const TYPE: React.CSSProperties = {
  fontFamily: roboto.fontFamily,
  fontWeight: 700,
  fontSize: FONT_SIZE,
  lineHeight: 1,
  letterSpacing: '0.11em',
  // Tracking adds a trailing space after the last glyph, which would throw the
  // centred pairs off centre.
  marginRight: '-0.11em',
  whiteSpace: 'nowrap',
};

const LegendItem: React.FC<{color: string; label: string; ink: string; opacity: number}> = ({
  color,
  label,
  ink,
  opacity,
}) => (
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
      width: CAPTION_CENTER * 2,
      display: 'flex',
      justifyContent: 'center',
      opacity: 0.92 * enter,
      transform: `translateY(${(1 - enter) * 16}px)`,
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
  // Theirs saturates: it still climbs, it just stops climbing fast.
  leadStart: z.number().min(0).max(1),
  leadMax: z.number().min(0).max(1),
  leadRate: z.number().min(0.5).max(8),
  // Everyone else accelerates into the space that leaves.
  fieldStart: z.number().min(0).max(1),
  fieldEnd: z.number().min(0).max(1),
  fieldCurve: z.number().min(1).max(4),
  dimOpacity: z.number().min(0).max(1),
  litOpacity: z.number().min(0).max(1),
  bandOpacity: z.number().min(0).max(1),
  axisOpacity: z.number().min(0).max(1),
  // Frames between rate ticks. One interval for both columns, or the comparison
  // of their spacing means nothing.
  tickEvery: z.number().int().min(10).max(60),
  labels: z.object({
    frontier: z.string(),
    field: z.string(),
    revenue: z.string(),
    megawatt: z.string(),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:39.719:
  //   17 "revenue per" · 29 "megawatt" · 55 "climb as" · 128 "incremental" ·
  //   167 "higher" · 185 "everyone else" · 223 "diminish"
  beats: z.object({
    revenue: z.number().int(),
    megawatt: z.number().int(),
    notClimb: z.number().int(),
    incremental: z.number().int(),
    higher: z.number().int(),
    everyoneElse: z.number().int(),
    diminish: z.number().int(),
  }),
});

export type ComputePremiumDiminishesProps = z.infer<typeof schema>;

export const defaultProps: ComputePremiumDiminishesProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  leadStart: 0.4,
  leadMax: 0.9,
  leadRate: 2.6,
  fieldStart: 0.18,
  fieldEnd: 0.72,
  fieldCurve: 1.7,
  dimOpacity: 0.12,
  litOpacity: 0.7,
  bandOpacity: 0.28,
  axisOpacity: 0.26,
  tickEvery: 30,
  labels: {
    frontier: 'FRONTIER',
    field: 'EVERYONE ELSE',
    revenue: 'REVENUE',
    megawatt: 'PER MEGAWATT',
  },
  beats: {
    revenue: 17,
    megawatt: 29,
    notClimb: 55,
    incremental: 128,
    higher: 167,
    everyoneElse: 185,
    diminish: 223,
  },
});

const ComputePremiumDiminishes: React.FC<ComputePremiumDiminishesProps> = ({
  ink,
  accent,
  shadow,
  leadStart,
  leadMax,
  leadRate,
  fieldStart,
  fieldEnd,
  fieldCurve,
  dimOpacity,
  litOpacity,
  bandOpacity,
  axisOpacity,
  tickEvery,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const {revenue, megawatt, notClimb, incremental, higher, everyoneElse, diminish} = beats;

  // Two closed-form curves, so the deceleration is continuous rather than
  // keyframed and the ticks compress smoothly. The beats only reveal things;
  // they never bend the economics.
  const rLead = (f: number) =>
    leadMax - (leadMax - leadStart) * Math.exp((-leadRate * f) / durationInFrames);
  const rField = (f: number) =>
    fieldStart + (fieldEnd - fieldStart) * Math.pow(f / durationInFrames, fieldCurve);

  const emerge = interpolate(frame, [0, 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leadH = rLead(frame) * SCALE * emerge;
  const fieldH = rField(frame) * SCALE * emerge;
  const leadTop = GROUND - leadH;
  const fieldTop = GROUND - fieldH;

  const fieldLit = interpolate(frame, [incremental - 6, incremental + 22], [dimOpacity, litOpacity], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The band is bounded by the two tops, so it cannot drift from them.
  const bandIn = interpolate(frame, [incremental + 22, higher + 8], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // The measure itself arrives on "everyone else".
  const leadersIn = interpolate(frame, [everyoneElse - 4, everyoneElse + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "Diminish" lands where the shrink is already steepest; the leaders brighten
  // rather than anything new arriving.
  const diminishPulse = interpolate(frame, [diminish - 3, diminish + 8, durationInFrames], [0, 1, 0.4], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ticksIn = interpolate(frame, [notClimb - 13, notClimb + 5], [0, 1], {
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
  const captionIn = interpolate(frame, [revenue, revenue + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const legendIn = interpolate(frame, [2, 18], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The widest the premium ever gets, scanned from the curves rather than
  // captured at a beat. Hung off the live top so the shrinking band stays
  // nested inside it and the evaporated part is the empty dashed remainder.
  let peakPremium = 0;
  for (let f = 0; f <= durationInFrames; f += 1) {
    peakPremium = Math.max(peakPremium, rLead(f) - rField(f));
  }

  const groundY = Math.round(GROUND) + 0.5;
  const bolt = BOLT.map(([bx, by]) => `${MW_X + bx * MW_SIZE},${MW_TOP + by * MW_SIZE}`).join(' ');

  const tickFrames: number[] = [];
  for (let tf = tickEvery; tf <= durationInFrames; tf += tickEvery) tickFrames.push(tf);

  const tickOpacity = (tf: number, base: number) =>
    base *
    ticksIn *
    interpolate(frame, [tf, tf + 10], [0, 1], {
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
        enter={captionIn}
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
          {/* The fraction bar, carried over. Revenue above, the megawatt below. */}
          <line
            x1={262}
            y1={groundY}
            x2={700}
            y2={groundY}
            stroke={ink}
            strokeWidth={3}
            opacity={axisOpacity}
          />

          {/* How much more they can pay for the incremental megawatt. */}
          <g opacity={bandIn}>
            <line
              x1={LEAD_X + COL_W}
              y1={Math.round(leadTop) + 0.5}
              x2={BAND_X2}
              y2={Math.round(leadTop) + 0.5}
              stroke={ink}
              strokeWidth={3}
              strokeDasharray="8 11"
              opacity={(0.28 + 0.3 * diminishPulse) * leadersIn}
            />
            <line
              x1={FIELD_X + COL_W}
              y1={Math.round(fieldTop) + 0.5}
              x2={BAND_X2}
              y2={Math.round(fieldTop) + 0.5}
              stroke={ink}
              strokeWidth={3}
              strokeDasharray="8 11"
              opacity={(0.28 + 0.3 * diminishPulse) * leadersIn}
            />
            <rect
              x={BAND_X1}
              y={leadTop}
              width={BAND_X2 - BAND_X1}
              height={Math.max(0, fieldTop - leadTop)}
              fill={accent}
              opacity={bandOpacity}
            />
            <rect
              x={BAND_X1}
              y={leadTop}
              width={BAND_X2 - BAND_X1}
              height={peakPremium * SCALE}
              fill="none"
              stroke={ink}
              strokeWidth={3}
              strokeDasharray="8 11"
              opacity={0.3}
            />
          </g>

          {/* Rate. Same interval on both, so the spacing is the comparison. */}
          {tickFrames.map((tf) => (
            <line
              key={`lt${tf}`}
              x1={LEAD_TICK_X1}
              y1={Math.round(GROUND - rLead(tf) * SCALE) + 0.5}
              x2={LEAD_TICK_X2}
              y2={Math.round(GROUND - rLead(tf) * SCALE) + 0.5}
              stroke={accent}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={tickOpacity(tf, 0.75)}
            />
          ))}
          {tickFrames.map((tf) => (
            <line
              key={`ft${tf}`}
              x1={FIELD_TICK_X1}
              y1={Math.round(GROUND - rField(tf) * SCALE) + 0.5}
              x2={FIELD_TICK_X2}
              y2={Math.round(GROUND - rField(tf) * SCALE) + 0.5}
              stroke={ink}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={tickOpacity(tf, 0.55) * interpolate(fieldLit, [dimOpacity, litOpacity], [0.35, 1])}
            />
          ))}

          <rect x={LEAD_X} y={leadTop} width={COL_W} height={leadH} fill={accent} opacity={0.95} />
          <rect x={FIELD_X} y={fieldTop} width={COL_W} height={fieldH} fill={ink} opacity={fieldLit} />

          {/* One megawatt, hanging below the line it is divided into. */}
          <g opacity={sqIn} transform={`translate(0 ${(1 - sqIn) * 18})`}>
            <rect
              x={MW_X}
              y={MW_TOP}
              width={MW_SIZE}
              height={MW_SIZE}
              fill="none"
              stroke={ink}
              strokeWidth={4}
              opacity={0.75}
            />
            <polygon points={bolt} fill={ink} opacity={0.58} />
            <circle
              cx={MW_X + MW_SIZE / 2}
              cy={MW_TOP + MW_SIZE / 2}
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

export default ComputePremiumDiminishes;
