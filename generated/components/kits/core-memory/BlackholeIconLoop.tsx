import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  moteCount: z.number().int().min(0).max(16),
  glintCount: z.number().int().min(0).max(4),
  liveliness: z.number().min(0).max(2),
});

export type BlackholeIconLoopProps = z.infer<typeof schema>;

export const defaultProps: BlackholeIconLoopProps = schema.parse({
  icon: 'blackhole.png',
  iconSize: 700,
  moteCount: 8,
  glintCount: 2,
  liveliness: 1,
});

// Geometry traced from the source icon, in its own 512x512 space.
const CX = 256;
const CY = 256;
const RIM = 113; // just outside the solid sphere
const SPAWN = 206; // inside the tips of the accretion spike
const SWALLOW = 96; // inside the sphere, where infalling matter disappears

// Stable per-mote scatter so the stream looks organic but never flickers.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const arcPath = (r: number, a0: number, a1: number) => {
  const x0 = CX + r * Math.cos(a0);
  const y0 = CY + r * Math.sin(a0);
  const x1 = CX + r * Math.cos(a1);
  const y1 = CY + r * Math.sin(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
};

const BlackholeIconLoop: React.FC<BlackholeIconLoopProps> = ({
  icon,
  iconSize,
  moteCount,
  glintCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  // Matter fed in along the disk plane, accelerating and settling into the
  // plane as gravity takes over.
  const motes = [];
  for (let i = 0; i < moteCount; i++) {
    const phase = i / moteCount;
    const p = (cycle + phase) % 1;
    const side = hash(i, 2) < 0.5 ? -1 : 1;

    const r = interpolate(p, [0, 1], [SPAWN, SWALLOW], {
      easing: Easing.in(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const lift = (hash(i, 1) - 0.5) * 46;
    const size = interpolate(p, [0, 1], [6.5, 3.2]);

    motes.push({
      key: i,
      x: CX + side * r,
      y: CY + lift * Math.pow(1 - p, 1.4),
      // Streaks stretch along their travel as gravity accelerates them.
      rx: size * interpolate(p, [0, 1], [1.6, 3.4]),
      ry: size,
      opacity: interpolate(p, [0, 0.12, 0.8, 1], [0, 0.9, 0.75, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    });
  }

  // Light bending around the event horizon: short arcs sweeping the rim,
  // dimming as they pass behind the thick part of the disk.
  const glints = [];
  for (let i = 0; i < glintCount; i++) {
    const a0 = Math.PI * 2 * ((cycle + i / glintCount) % 1);
    const span = 0.6; // ~34 degrees
    const mid = a0 + span / 2;
    glints.push({
      key: i,
      d: arcPath(RIM, a0, a0 + span),
      opacity: 0.34 * (0.25 + 0.75 * Math.abs(Math.sin(mid))),
    });
  }

  const sway = Math.sin(cycle * Math.PI * 2);
  const pulse = Math.sin(cycle * Math.PI * 4);

  const svgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          rotate: `${sway * 2.2 * liveliness}deg`,
          // Volume-preserving squash: the disk flares wide as the core settles.
          scale: `${1 + pulse * 0.02 * liveliness} ${
            1 - pulse * 0.012 * liveliness
          }`,
          translate: `0px ${Math.cos(cycle * Math.PI * 2) * 3 * liveliness}px`,
        }}
      >
        {/* Behind the icon, so infalling matter is occluded by the sphere. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          {motes.map((mote) => (
            <ellipse
              key={`mote-${mote.key}`}
              cx={mote.x}
              cy={mote.y}
              rx={mote.rx}
              ry={mote.ry}
              fill="#000000"
              opacity={mote.opacity}
            />
          ))}
          {glints.map((glint) => (
            <path
              key={`glint-${glint.key}`}
              d={glint.d}
              fill="none"
              stroke="#000000"
              strokeWidth={7}
              strokeLinecap="round"
              opacity={glint.opacity}
            />
          ))}
        </svg>

        <Img
          src={staticFile(icon)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default BlackholeIconLoop;
