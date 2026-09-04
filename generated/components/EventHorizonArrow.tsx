import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  background: z.string().default('#101420'),
  holeColor: z.string().default('#07090E'),
  accent: z.string().default('#D9A66C'),
  slate: z.string().default('#5C6B85'),
});

export type EventHorizonArrowProps = z.infer<typeof schema>;

export const defaultProps: EventHorizonArrowProps = schema.parse({});

// Closeup framing: same hole proportions as the wide scenes, scaled up
const CX = 540;
const CY = 960;
const HOLE_R = 240;
const RING_R = 262;

const STARS: Array<{x: number; y: number; r: number; o: number}> = [
  {x: 180, y: 380, r: 2.2, o: 0.22},
  {x: 860, y: 300, r: 1.8, o: 0.18},
  {x: 940, y: 1240, r: 2.4, o: 0.2},
  {x: 130, y: 1180, r: 1.6, o: 0.16},
  {x: 700, y: 1500, r: 2.0, o: 0.18},
  {x: 330, y: 220, r: 1.5, o: 0.15},
];

// Arrow direction: from upper-right, aimed at the horizon's rim
const ARROW_ANGLE = (-38 * Math.PI) / 180;

const EventHorizonArrow: React.FC<EventHorizonArrowProps> = ({
  background,
  holeColor,
  accent,
  slate,
}) => {
  const frame = useCurrentFrame();

  const arrowIn = interpolate(frame, [16, 38], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // A slow breath toward the rim, settling before the end
  const breatheEnvelope = interpolate(frame, [40, 52, 96, 112], [0, 1, 1, 0], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const breathe = Math.max(0, Math.sin(((frame - 40) / 46) * Math.PI * 2)) * 8 * breatheEnvelope;

  const ux = Math.cos(ARROW_ANGLE);
  const uy = Math.sin(ARROW_ANGLE);
  // Tail sits out in the field; tip lands just outside the ring
  const tipR = RING_R + 34 - breathe;
  const tailR = tipR + 150 * arrowIn;
  const x1 = CX + ux * tailR;
  const y1 = CY + uy * tailR;
  const x2 = CX + ux * tipR;
  const y2 = CY + uy * tipR;
  const head = 15;
  const px = -uy;
  const py = ux;
  const hx1 = x2 + ux * head + px * head * 0.66;
  const hy1 = y2 + uy * head + py * head * 0.66;
  const hx2 = x2 + ux * head - px * head * 0.66;
  const hy2 = y2 + uy * head - py * head * 0.66;

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 900px 700px at 50% 50%, rgba(92,107,133,0.14), rgba(92,107,133,0) 70%)`,
        }}
      />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={slate} opacity={s.o} />
        ))}

        <g>
          <circle
            cx={CX}
            cy={CY}
            r={RING_R}
            fill="none"
            stroke={accent}
            strokeWidth={16}
            opacity={0.16}
            style={{filter: 'blur(22px)'}}
          />
          <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke={accent} strokeWidth={2.5} opacity={0.9} />
          <circle cx={CX} cy={CY} r={HOLE_R} fill={holeColor} />
        </g>

        {arrowIn > 0.001 ? (
          <g stroke={accent} strokeWidth={4} strokeLinecap="round" opacity={0.9 * arrowIn} fill="none">
            <path d={`M ${x1} ${y1} L ${x2} ${y2}`} />
            <path d={`M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`} />
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export default EventHorizonArrow;
