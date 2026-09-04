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

export const FPS = 24;
export const DURATION = 96; // 4s

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  waveCount: z.number().int().min(0).max(6),
  windCount: z.number().int().min(0).max(4),
  liveliness: z.number().min(0).max(2),
});

export type PresidentIconLoopProps = z.infer<typeof schema>;

export const defaultProps: PresidentIconLoopProps = schema.parse({
  icon: 'president.png',
  iconSize: 720,
  waveCount: 3,
  windCount: 1,
  liveliness: 1,
});

// Geometry traced from the source icon, in its own 512x512 space.
// Voice leaves at mouth height and spreads sideways into the room, clearing
// the raised arm on the right and the flagpoles below.
const MOUTH_X = 240;
const MOUTH_Y = 82;
const WAVE_AXIS = 0.62; // radians above horizontal
const WAVE_SPAN = 0.85; // ~49deg of arc
const WAVE_NEAR = 88;
const WAVE_FAR = 168;

// Flags: the left one hangs down-left, the right one mirrors it.
const FLAG_Y = 196;

// Stable per-element scatter so the flair looks organic but never flickers.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
};

const PresidentIconLoop: React.FC<PresidentIconLoopProps> = ({
  icon,
  iconSize,
  waveCount,
  windCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  // Amplified voice: matched arcs leaving both sides of his head,
  // decelerating as they spread and thinning as the energy spends itself.
  const waves = [];
  for (let i = 0; i < waveCount; i++) {
    const p = (cycle + i / waveCount) % 1;

    const r = interpolate(p, [0, 1], [WAVE_NEAR, WAVE_FAR], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const width = interpolate(p, [0, 1], [7.5, 4]);
    const opacity =
      interpolate(p, [0, 0.2, 0.6, 1], [0, 0.26, 0.17, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) * liveliness;

    for (let s = 0; s < 2; s++) {
      // Right wedge points up-and-right; the left one is its mirror.
      const axis = s === 0 ? -WAVE_AXIS : -(Math.PI - WAVE_AXIS);
      waves.push({
        key: `${i}-${s}`,
        d: arcPath(
          MOUTH_X,
          MOUTH_Y,
          r,
          axis - WAVE_SPAN / 2,
          axis + WAVE_SPAN / 2,
        ),
        width,
        opacity,
      });
    }
  }

  // Wind off the flags: short ripple dashes that emerge from behind each
  // banner, drift outward and sink as they lose the gust.
  const winds = [];
  for (let s = 0; s < 2; s++) {
    const side = s === 0 ? -1 : 1;
    const startX = side < 0 ? 52 : 460;

    for (let i = 0; i < windCount; i++) {
      const p = (cycle + i / windCount + s * 0.37) % 1;
      const ease = interpolate(p, [0, 1], [0, 1], {
        easing: Easing.out(Easing.quad),
      });

      const y = FLAG_Y + i * 40 + hash(i, s) * 12 + ease * 10;
      const x = startX + side * ease * 62;

      winds.push({
        key: `${s}-${i}`,
        d: `M ${x} ${y} q ${side * 16} -7 ${side * 32} 0`,
        opacity:
          interpolate(p, [0, 0.24, 0.66, 1], [0, 0.24, 0.15, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }) * liveliness,
      });
    }
  }

  const sway = Math.sin(cycle * Math.PI * 2);
  // Twice-per-loop breath, in step with the speaking cadence.
  const breath = Math.sin(cycle * Math.PI * 4);

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
          rotate: `${sway * 1.3 * liveliness}deg`,
          // Volume-preserving: he draws himself up on the inhale.
          scale: `${1 - breath * 0.009 * liveliness} ${
            1 + breath * 0.014 * liveliness
          }`,
          translate: `0px ${Math.cos(cycle * Math.PI * 2) * 3 * liveliness}px`,
        }}
      >
        {/* Behind the icon, so the figure, podium and flags occlude it. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          {waves.map((wave) => (
            <path
              key={`wave-${wave.key}`}
              d={wave.d}
              fill="none"
              stroke="#000000"
              strokeWidth={wave.width}
              strokeLinecap="round"
              opacity={wave.opacity}
            />
          ))}
          {winds.map((wind) => (
            <path
              key={`wind-${wind.key}`}
              d={wind.d}
              fill="none"
              stroke="#000000"
              strokeWidth={5.5}
              strokeLinecap="round"
              opacity={wind.opacity}
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

export default PresidentIconLoop;
