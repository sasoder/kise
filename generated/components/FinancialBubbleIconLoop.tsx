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
  archCount: z.number().int().min(0).max(6),
  moteCount: z.number().int().min(0).max(12),
  shardCount: z.number().int().min(0).max(12),
  liveliness: z.number().min(0).max(2),
});

export type FinancialBubbleIconLoopProps = z.infer<typeof schema>;

export const defaultProps: FinancialBubbleIconLoopProps = schema.parse({
  icon: 'financialbubble.png',
  iconSize: 720,
  archCount: 2,
  moteCount: 6,
  shardCount: 8,
  liveliness: 1,
});

// Geometry traced from the source icon, in its own 512x512 space.
// The dollar bubble sits lower-left with the needle coming down from the hand;
// the dotted ring at right is a bubble that has already gone.
const BUBBLE_CX = 147;
const BUBBLE_CY = 292;
const BUBBLE_R = 129;

const POPPED_CX = 421;
const POPPED_CY = 300;
const POPPED_R = 57;

// Empty floor under the bubble, clear of the bottom-centre sparkle cluster.
const FLOOR_Y = 508;
const FLOOR_X0 = 62;
const FLOOR_X1 = 250;

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

const FinancialBubbleIconLoop: React.FC<FinancialBubbleIconLoopProps> = ({
  icon,
  iconSize,
  archCount,
  moteCount,
  shardCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  // One breath per loop: the bubble inflates to peak strain a quarter of the
  // way in, and everything else is timed off the same curve.
  const swell = Math.sin(cycle * Math.PI * 2);

  // Pressure shed off the skin of the bubble, decelerating as it goes. Short
  // arcs on the open lower-left side only — a full ring reads as a target and
  // rewrites the icon's silhouette.
  const arches = [];
  for (let i = 0; i < archCount; i++) {
    const p = (cycle + i / archCount) % 1;
    const r =
      BUBBLE_R +
      interpolate(p, [0, 1], [7, 44], {
        easing: Easing.out(Easing.quad),
      });
    const span = 1.5; // ~86deg
    const a0 = Math.PI * 0.72 - span / 2 + swell * 0.05;
    arches.push({
      key: i,
      d: arcPath(BUBBLE_CX, BUBBLE_CY, r, a0, a0 + span),
      width: interpolate(p, [0, 1], [6, 1.6]),
      opacity: interpolate(p, [0, 0.16, 1], [0, 0.15, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    });
  }

  // Froth rising off the floor and dissolving before it reaches the bubble.
  const motes = [];
  for (let i = 0; i < moteCount; i++) {
    const p = (cycle + i / moteCount) % 1;
    const x0 = FLOOR_X0 + hash(i, 0) * (FLOOR_X1 - FLOOR_X0);
    const rise = interpolate(p, [0, 1], [0, 96], {
      easing: Easing.out(Easing.quad),
    });
    motes.push({
      key: i,
      x: x0 + Math.sin(p * Math.PI * 2 + hash(i, 1) * 6.28) * 7,
      y: FLOOR_Y - rise,
      r: 3 + hash(i, 2) * 3,
      opacity: interpolate(p, [0, 0.18, 0.72, 1], [0, 0.34, 0.26, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    });
  }

  // The bubble on the right is already gone: its skin flicks outward once per
  // loop, just after the big one hits peak strain.
  const pop = interpolate(cycle, [0.26, 0.38, 0.62], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shards = [];
  for (let i = 0; i < shardCount; i++) {
    // Offset half a step so shards sit in the gaps between the printed dots.
    const a = ((i + 0.5) / shardCount) * Math.PI * 2;
    const near = POPPED_R + 12 + pop * 16;
    const far = near + 6 + pop * 9;
    shards.push({
      key: i,
      x1: POPPED_CX + near * Math.cos(a),
      y1: POPPED_CY + near * Math.sin(a),
      x2: POPPED_CX + far * Math.cos(a),
      y2: POPPED_CY + far * Math.sin(a),
      opacity: 0.34 * Math.sin(pop * Math.PI) * (0.7 + 0.3 * hash(i, 3)),
    });
  }

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
          rotate: `${swell * 1.5 * liveliness}deg`,
          // Volume-preserving swell, so the bubble bulges rather than zooms.
          scale: `${1 + swell * 0.015 * liveliness} ${
            1 - swell * 0.009 * liveliness
          }`,
          translate: `0px ${Math.cos(cycle * Math.PI * 2) * 3 * liveliness}px`,
        }}
      >
        {/* Behind the icon, so the bubble and hand occlude it correctly. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          {arches.map((arch) => (
            <path
              key={`arch-${arch.key}`}
              d={arch.d}
              fill="none"
              stroke="#000000"
              strokeWidth={arch.width}
              strokeLinecap="round"
              opacity={arch.opacity * liveliness}
            />
          ))}
          {motes.map((mote) => (
            <circle
              key={`mote-${mote.key}`}
              cx={mote.x}
              cy={mote.y}
              r={mote.r}
              fill="#000000"
              opacity={mote.opacity * liveliness}
            />
          ))}
          {shards.map((shard) => (
            <line
              key={`shard-${shard.key}`}
              x1={shard.x1}
              y1={shard.y1}
              x2={shard.x2}
              y2={shard.y2}
              stroke="#000000"
              strokeWidth={7}
              strokeLinecap="round"
              opacity={shard.opacity * liveliness}
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

export default FinancialBubbleIconLoop;
