import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  background: z.string().default('#101420'),
  holeColor: z.string().default('#07090E'),
  accent: z.string().default('#D9A66C'),
  slate: z.string().default('#5C6B85'),
});

export type CouplingPullProps = z.infer<typeof schema>;

export const defaultProps: CouplingPullProps = schema.parse({});

// Same stage geometry as the other black hole scenes, for continuity
const CX = 540;
const CY = 960;
const RX = 370;
const RY = 145;
const TILT = -16; // degrees
const ORBIT_PERIOD = 78; // frames per revolution

// One second of animation-free padding at each end for edit freedom
const PAD = 30;
const ARROW_IN = PAD + 4; // "an additional pull down towards the black hole"
const RING_PULSE = PAD + 30; // "the mass of the black hole"
const TETHER_IN = PAD + 36; // "the coupling between..."
const TRAIL_PULSE = PAD + 66; // "your orbital angular energy"
const JOINT_PULSE = PAD + 88; // both ends of the coupling glow together
const CONTRACT_START = PAD + 110; // the pull wins a little ground
const CONTRACT_END = PAD + 155;

const STARS: Array<{x: number; y: number; r: number; o: number}> = [
  {x: 180, y: 380, r: 2.2, o: 0.22},
  {x: 860, y: 300, r: 1.8, o: 0.18},
  {x: 940, y: 1240, r: 2.4, o: 0.2},
  {x: 130, y: 1180, r: 1.6, o: 0.16},
  {x: 700, y: 1500, r: 2.0, o: 0.18},
  {x: 330, y: 220, r: 1.5, o: 0.15},
];

const TILT_RAD = (TILT * Math.PI) / 180;

const CouplingPull: React.FC<CouplingPullProps> = ({
  background,
  holeColor,
  accent,
  slate,
}) => {
  const frame = useCurrentFrame();

  // A smooth half-sine envelope: 0 -> 1 -> 0 across [a, b]
  const env = (a: number, b: number) => {
    const t = interpolate(frame, [a, b], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return Math.sin(t * Math.PI);
  };

  const orbitScale = interpolate(frame, [CONTRACT_START, CONTRACT_END], [1, 0.885], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const orbitPoint = (t: number) => {
    const ex = RX * orbitScale * Math.cos(t);
    const ey = RY * orbitScale * Math.sin(t);
    return {
      x: CX + ex * Math.cos(TILT_RAD) - ey * Math.sin(TILT_RAD),
      y: CY + ex * Math.sin(TILT_RAD) + ey * Math.cos(TILT_RAD),
      farSide: Math.sin(t) < 0,
    };
  };

  const angle = -Math.PI * 0.35 + (frame / ORBIT_PERIOD) * Math.PI * 2;
  const sat = orbitPoint(angle);

  const ringPulse = Math.min(1, env(RING_PULSE, RING_PULSE + 28) + env(JOINT_PULSE, JOINT_PULSE + 28));
  const trailPulse = Math.min(1, env(TRAIL_PULSE, TRAIL_PULSE + 28) + env(JOINT_PULSE, JOINT_PULSE + 28));

  const tetherIn = interpolate(frame, [TETHER_IN, TETHER_IN + 26], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const arrowIn = interpolate(frame, [ARROW_IN, ARROW_IN + 18], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const trail = [1, 2, 3, 4, 5, 6, 7].map((i) => {
    const p = orbitPoint(angle - i * 0.13);
    const base = (1 - i / 8) * 0.35;
    return {...p, opacity: Math.min(0.85, base * (1 + trailPulse * 1.1))};
  });

  // The pull arrow rides with the satellite, aimed at the hole
  const toHoleX = CX - sat.x;
  const toHoleY = CY - sat.y;
  const dist = Math.hypot(toHoleX, toHoleY);
  const ux = toHoleX / dist;
  const uy = toHoleY / dist;
  const arrowLen = (58 + env(JOINT_PULSE, JOINT_PULSE + 28) * 10) * arrowIn;
  const ax1 = sat.x + ux * 22;
  const ay1 = sat.y + uy * 22;
  const ax2 = sat.x + ux * (22 + arrowLen);
  const ay2 = sat.y + uy * (22 + arrowLen);
  const head = 13;
  const px = -uy;
  const py = ux;

  const satellite = (visibleWhenFar: boolean) =>
    sat.farSide === visibleWhenFar ? (
      <g>
        {trail.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={(5.5 - i * 0.55) * (1 + trailPulse * 0.15)}
            fill={accent}
            opacity={p.opacity}
          />
        ))}
        {arrowIn > 0.001 ? (
          <g stroke={accent} strokeWidth={4} strokeLinecap="round" opacity={0.9 * arrowIn} fill="none">
            <path d={`M ${ax1} ${ay1} L ${ax2} ${ay2}`} />
            <path
              d={`M ${ax2 - ux * head + px * head * 0.66} ${ay2 - uy * head + py * head * 0.66} L ${ax2} ${ay2} L ${ax2 - ux * head - px * head * 0.66} ${ay2 - uy * head - py * head * 0.66}`}
            />
          </g>
        ) : null}
        <circle cx={sat.x} cy={sat.y} r={9} fill={accent} />
      </g>
    ) : null;

  // Tether from the hole out to the satellite; the disc hides its inner end
  const tx = CX + (sat.x - CX) * tetherIn;
  const ty = CY + (sat.y - CY) * tetherIn;

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

        <ellipse
          cx={CX}
          cy={CY}
          rx={RX * orbitScale}
          ry={RY * orbitScale}
          transform={`rotate(${TILT} ${CX} ${CY})`}
          fill="none"
          stroke={slate}
          strokeWidth={1.5}
          opacity={0.45}
          strokeLinecap="round"
        />

        {satellite(true)}

        {tetherIn > 0.001 ? (
          <path
            d={`M ${CX} ${CY} L ${tx} ${ty}`}
            stroke={slate}
            strokeWidth={2}
            opacity={0.5}
            strokeLinecap="round"
          />
        ) : null}

        <g>
          <circle
            cx={CX}
            cy={CY}
            r={122 + ringPulse * 4}
            fill="none"
            stroke={accent}
            strokeWidth={10}
            opacity={0.16 + ringPulse * 0.18}
            style={{filter: 'blur(14px)'}}
          />
          <circle
            cx={CX}
            cy={CY}
            r={122 + ringPulse * 4}
            fill="none"
            stroke={accent}
            strokeWidth={2 + ringPulse * 0.8}
            opacity={0.9}
          />
          <circle cx={CX} cy={CY} r={112} fill={holeColor} />
        </g>

        {satellite(false)}
      </svg>
    </AbsoluteFill>
  );
};

export default CouplingPull;
