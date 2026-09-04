import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  faceColor: z.string(),
  startHour: z.number().min(0).max(12),
  hoursElapsed: z.number().positive(),
});

export type ClockFiveHourSpinProps = z.infer<typeof schema>;

export const defaultProps: ClockFiveHourSpinProps = schema.parse({
  faceColor: '#000000',
  startHour: 4,
  hoursElapsed: 5,
});

const ClockFiveHourSpin: React.FC<ClockFiveHourSpinProps> = ({
  faceColor,
  startHour,
  hoursElapsed,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // One shared linear progress keeps both hands at constant velocity, with the
  // minute hand locked at exactly 12x the hour hand's rate.
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const hourStartDeg = (startHour / 12) * 360;
  const hourDeg = hourStartDeg + progress * hoursElapsed * 30;
  const minuteDeg = progress * hoursElapsed * 360;

  // Geometry mirrors the source icon: full-bleed disc, thick rounded hands.
  const size = 1000;
  const c = size / 2;
  const handWidth = size * 0.085;
  const minuteLength = size * 0.27;
  const hourLength = size * 0.2;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Hands are cut out of the disc so the background shows through them. */}
        <mask id="hands-cutout">
          <rect width={size} height={size} fill="white" />
          <g transform={`rotate(${minuteDeg} ${c} ${c})`}>
            <line
              x1={c}
              y1={c}
              x2={c}
              y2={c - minuteLength}
              stroke="black"
              strokeWidth={handWidth}
              strokeLinecap="round"
            />
          </g>
          <g transform={`rotate(${hourDeg} ${c} ${c})`}>
            <line
              x1={c}
              y1={c}
              x2={c}
              y2={c - hourLength}
              stroke="black"
              strokeWidth={handWidth}
              strokeLinecap="round"
            />
          </g>
        </mask>
        <circle cx={c} cy={c} r={c} fill={faceColor} mask="url(#hands-cutout)" />
      </svg>
    </AbsoluteFill>
  );
};

export default ClockFiveHourSpin;
