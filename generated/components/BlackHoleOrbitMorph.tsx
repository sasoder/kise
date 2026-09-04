import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  background: z.string().default('#101420'),
  holeColor: z.string().default('#07090E'),
  accent: z.string().default('#D9A66C'),
  slate: z.string().default('#5C6B85'),
});

export type BlackHoleOrbitMorphProps = z.infer<typeof schema>;

export const defaultProps: BlackHoleOrbitMorphProps = schema.parse({});

// Stage geometry (upper-middle third of the 1080x1920 frame)
const CX = 540;
const CY = 960;
const RX = 370;
const RY = 145;
const TILT = -16; // degrees
const ORBIT_PERIOD = 78; // frames per revolution

// The voiceover pivot ("just like you would orbit...") lands ~2.44s in
const MORPH_START = 73;
const MORPH_END = 95;

const STARS: Array<{x: number; y: number; r: number; o: number}> = [
  {x: 180, y: 380, r: 2.2, o: 0.22},
  {x: 860, y: 300, r: 1.8, o: 0.18},
  {x: 940, y: 1240, r: 2.4, o: 0.2},
  {x: 130, y: 1180, r: 1.6, o: 0.16},
  {x: 700, y: 1500, r: 2.0, o: 0.18},
  {x: 330, y: 220, r: 1.5, o: 0.15},
];

const TILT_RAD = (TILT * Math.PI) / 180;

const orbitPoint = (t: number) => {
  const ex = RX * Math.cos(t);
  const ey = RY * Math.sin(t);
  return {
    x: CX + ex * Math.cos(TILT_RAD) - ey * Math.sin(TILT_RAD),
    y: CY + ex * Math.sin(TILT_RAD) + ey * Math.cos(TILT_RAD),
    farSide: Math.sin(t) < 0,
  };
};

const BlackHoleOrbitMorph: React.FC<BlackHoleOrbitMorphProps> = ({
  background,
  holeColor,
  accent,
  slate,
}) => {
  const frame = useCurrentFrame();

  // Entrance
  const pathDraw = interpolate(frame, [0, 22], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const massScale = interpolate(frame, [0, 24], [0.9, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const satelliteIn = interpolate(frame, [6, 22], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The swap: black hole slides down and out, Earth drops in from the top.
  // The orbit line and the satellite's pace never change.
  const holeY = interpolate(frame, [MORPH_START, MORPH_END + 6], [0, 1250], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const earthY = interpolate(frame, [MORPH_START + 11, MORPH_END + 15], [-1300, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Constant angular pace, unbroken through the morph
  const angle = -Math.PI * 0.35 + (frame / ORBIT_PERIOD) * Math.PI * 2;
  const sat = orbitPoint(angle);

  const trail = [1, 2, 3, 4, 5].map((i) => {
    const p = orbitPoint(angle - i * 0.13);
    return {...p, opacity: (1 - i / 6) * 0.35 * satelliteIn};
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
        <circle cx={sat.x} cy={sat.y} r={9} fill={accent} opacity={satelliteIn} />
      </g>
    ) : null;

  const orbitCircumference = Math.PI * (3 * (RX + RY) - Math.sqrt((3 * RX + RY) * (RX + 3 * RY)));

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 900px 700px at 50% ${(CY / 1920) * 100}%, rgba(92,107,133,0.14), rgba(92,107,133,0) 70%)`,
        }}
      />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={slate} opacity={s.o} />
        ))}

        <ellipse
          cx={CX}
          cy={CY}
          rx={RX}
          ry={RY}
          transform={`rotate(${TILT} ${CX} ${CY})`}
          fill="none"
          stroke={slate}
          strokeWidth={1.5}
          opacity={0.45}
          strokeDasharray={orbitCircumference}
          strokeDashoffset={orbitCircumference * (1 - pathDraw)}
          strokeLinecap="round"
        />

        {satellite(true)}

        <g transform={`translate(${CX} ${CY + holeY}) scale(${massScale})`}>
          {/* soft warm halo behind the ring */}
          <circle
            cx={0}
            cy={0}
            r={122}
            fill="none"
            stroke={accent}
            strokeWidth={10}
            opacity={0.16}
            style={{filter: 'blur(14px)'}}
          />
          <circle cx={0} cy={0} r={122} fill="none" stroke={accent} strokeWidth={2} opacity={0.9} />
          <circle cx={0} cy={0} r={112} fill={holeColor} />
        </g>

        <g transform={`translate(${CX} ${CY + earthY})`}>
          <circle cx={0} cy={0} r={90} fill="#4E6883" />
          <g clipPath="url(#earthClip)">
            {/* abstract continents: one large sprawling mass, a peninsula tail, an island chain */}
            <path
              d="M -96 -44 C -70 -66 -34 -70 -10 -60 C 8 -52 16 -38 6 -26 C -2 -17 -14 -20 -24 -14 C -30 -10 -28 0 -36 6 C -48 15 -64 10 -74 0 C -88 -13 -104 -30 -96 -44 Z"
              fill="#8CA08D"
            />
            <path
              d="M -34 10 C -26 4 -14 6 -10 16 C -6 26 -12 34 -10 44 C -8 56 -16 68 -26 64 C -36 60 -34 46 -38 36 C -42 25 -42 16 -34 10 Z"
              fill="#8CA08D"
            />
            <path
              d="M 34 -32 C 52 -44 76 -38 86 -22 C 94 -8 88 6 74 8 C 60 10 54 0 44 -6 C 34 -12 26 -26 34 -32 Z"
              fill="#8CA08D"
            />
            <path
              d="M 48 30 C 60 24 74 30 76 42 C 78 54 66 62 54 58 C 42 54 38 36 48 30 Z"
              fill="#8CA08D"
            />
            <ellipse cx={22} cy={66} rx={9} ry={6} fill="#8CA08D" />
            <ellipse cx={88} cy={64} rx={7} ry={5} fill="#8CA08D" transform="rotate(-20 88 64)" />
            <ellipse cx={12} cy={-78} rx={12} ry={6} fill="#8CA08D" transform="rotate(12 12 -78)" />
          </g>
          <circle cx={0} cy={0} r={90} fill="url(#planetShade)" />
        </g>

        {satellite(false)}

        <defs>
          <clipPath id="earthClip">
            <circle cx={0} cy={0} r={90} />
          </clipPath>
          <radialGradient id="planetShade" cx="0.38" cy="0.32" r="0.85">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.14} />
            <stop offset="55%" stopColor={slate} stopOpacity={0} />
            <stop offset="100%" stopColor="#1A2130" stopOpacity={0.55} />
          </radialGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

export default BlackHoleOrbitMorph;
