import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {weights: ['700']});

export const schema = z.object({
  background: z.string().default('#101420'),
  holeColor: z.string().default('#07090E'),
  accent: z.string().default('#D9A66C'),
  slate: z.string().default('#5C6B85'),
});

export type ThreeGmSpiralProps = z.infer<typeof schema>;

export const defaultProps: ThreeGmSpiralProps = schema.parse({});

// Same stage geometry as the other black hole scenes, for continuity
const CX = 540;
const CY = 960;
const RX = 370;
const RY = 145;
const TILT = -16; // degrees
const ORBIT_PERIOD = 78; // frames per revolution

// One second of animation-free padding at each end for edit freedom
const PAD = 30;
const THRESHOLD_IN = PAD + 60; // "...once you get within 3 gm"
const SPIRAL_START = PAD + 89; // the orbit gives up its altitude
const SPIRAL_END = PAD + 132;
const THRESHOLD_SCALE = 0.55;

const STARS: Array<{x: number; y: number; r: number; o: number}> = [
  {x: 180, y: 380, r: 2.2, o: 0.22},
  {x: 860, y: 300, r: 1.8, o: 0.18},
  {x: 940, y: 1240, r: 2.4, o: 0.2},
  {x: 130, y: 1180, r: 1.6, o: 0.16},
  {x: 700, y: 1500, r: 2.0, o: 0.18},
  {x: 330, y: 220, r: 1.5, o: 0.15},
];

const TILT_RAD = (TILT * Math.PI) / 180;

const ThreeGmSpiral: React.FC<ThreeGmSpiralProps> = ({
  background,
  holeColor,
  accent,
  slate,
}) => {
  const frame = useCurrentFrame();

  const orbitScale = interpolate(
    frame,
    [SPIRAL_START, SPIRAL_END, 234],
    [1, THRESHOLD_SCALE, 0.505],
    {
      easing: Easing.bezier(0.45, 0, 0.55, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  // Inside the threshold the orbit quickens: extra phase accumulates
  const hurry = interpolate(frame, [SPIRAL_START, 234], [0, 2.4], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const angle = -Math.PI * 0.35 + (frame / ORBIT_PERIOD) * Math.PI * 2 + hurry;

  const pointAt = (t: number, scale: number) => {
    const ex = RX * scale * Math.cos(t);
    const ey = RY * scale * Math.sin(t);
    return {
      x: CX + ex * Math.cos(TILT_RAD) - ey * Math.sin(TILT_RAD),
      y: CY + ex * Math.sin(TILT_RAD) + ey * Math.cos(TILT_RAD),
      farSide: Math.sin(t) < 0,
    };
  };

  const sat = pointAt(angle, orbitScale);

  const trail = [1, 2, 3, 4, 5].map((i) => {
    const p = pointAt(angle - i * 0.13, orbitScale);
    return {...p, opacity: (1 - i / 6) * 0.35};
  });

  const satellite = (visibleWhenFar: boolean) =>
    sat.farSide === visibleWhenFar ? (
      <g>
        {trail.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={5.5 - i * 0.7}
            fill={accent}
            opacity={p.opacity}
          />
        ))}
        <circle cx={sat.x} cy={sat.y} r={9} fill={accent} />
      </g>
    ) : null;

  // Ellipse halves as sampled paths so the near side can render in front
  // of the disc once the orbit tightens inside the hole's silhouette
  const halfPath = (scale: number, far: boolean) => {
    const pts: string[] = [];
    for (let i = 0; i <= 64; i++) {
      const t = (far ? Math.PI : 0) + (i / 64) * Math.PI;
      const p = pointAt(t, scale);
      pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const thresholdIn = interpolate(frame, [THRESHOLD_IN, THRESHOLD_IN + 20], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Label sits off the threshold ellipse's right end
  const labelAnchor = pointAt(0, THRESHOLD_SCALE);

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

        {/* far halves render behind the disc */}
        <path
          d={halfPath(orbitScale, true)}
          fill="none"
          stroke={slate}
          strokeWidth={1.5}
          opacity={0.45}
          strokeLinecap="round"
        />
        <g opacity={thresholdIn}>
          <path
            d={halfPath(THRESHOLD_SCALE, true)}
            fill="none"
            stroke={slate}
            strokeWidth={2}
            strokeDasharray="5 11"
            strokeLinecap="round"
            opacity={0.65}
          />
          <text
            x={labelAnchor.x + 26}
            y={labelAnchor.y + 8}
            fill={slate}
            fontFamily={fontFamily}
            fontSize={34}
            fontWeight={700}
            letterSpacing={2}
          >
            3 GM
          </text>
        </g>

        {satellite(true)}

        <g>
          <circle
            cx={CX}
            cy={CY}
            r={122}
            fill="none"
            stroke={accent}
            strokeWidth={10}
            opacity={0.16}
            style={{filter: 'blur(14px)'}}
          />
          <circle cx={CX} cy={CY} r={122} fill="none" stroke={accent} strokeWidth={2} opacity={0.9} />
          <circle cx={CX} cy={CY} r={112} fill={holeColor} />
        </g>

        {/* near halves render in front of the disc */}
        <path
          d={halfPath(orbitScale, false)}
          fill="none"
          stroke={slate}
          strokeWidth={1.5}
          opacity={0.45}
          strokeLinecap="round"
        />
        <path
          d={halfPath(THRESHOLD_SCALE, false)}
          fill="none"
          stroke={slate}
          strokeWidth={2}
          strokeDasharray="5 11"
          strokeLinecap="round"
          opacity={0.65 * thresholdIn}
        />

        {satellite(false)}
      </svg>
    </AbsoluteFill>
  );
};

export default ThreeGmSpiral;
