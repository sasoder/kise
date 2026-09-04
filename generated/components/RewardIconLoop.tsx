import {
  AbsoluteFill,
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
  sparkleCount: z.number().int().min(0).max(10),
  liveliness: z.number().min(0).max(2),
});

export type RewardIconLoopProps = z.infer<typeof schema>;

export const defaultProps: RewardIconLoopProps = schema.parse({
  icon: 'reward.png',
  iconSize: 700,
  sparkleCount: 6,
  liveliness: 1,
});

const BOX = 512;

// Measured off the source icon in its own 512x512 space: the medal is a solid
// disk centred at (256, 192) with radius ~191, and the two ribbon tails run out
// from behind it towards the bottom corners.
const CX = 256;
const CY = 192;
const MEDAL_R = 194; // a hair past the artwork, so the disk layer covers the cut
const CUT_R = 188; // inside the rim: the ribbons keep the outer sliver

// The ribbons are cut out along the disk's own arc, so rotating them about the
// disk centre slides that edge along itself and the seam stays hidden. The
// straight parts of each boundary only ever cross empty pixels.
const RIBBON_LEFT = `M0,280 L89.9,280 A${CUT_R},${CUT_R} 0 0 0 256,380 L256,${BOX} L0,${BOX} Z`;
const RIBBON_RIGHT = `M${BOX},280 L422.1,280 A${CUT_R},${CUT_R} 0 0 1 256,380 L256,${BOX} L${BOX},${BOX} Z`;
const MEDAL = `M${CX - MEDAL_R},${CY} a${MEDAL_R},${MEDAL_R} 0 1,0 ${
  MEDAL_R * 2
},0 a${MEDAL_R},${MEDAL_R} 0 1,0 ${-MEDAL_R * 2},0`;

// Four-point twinkle on a unit box, drawn from its own centre.
const TWINKLE =
  'M0,-1 Q0.16,-0.16 1,0 Q0.16,0.16 0,1 Q-0.16,0.16 -1,0 Q-0.16,-0.16 0,-1 Z';

// Stable per-sparkle scatter so the shine looks organic but never flickers.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// Soft once-per-cycle swell, phase-shifted so the loop point lands in the rest.
const swell = (cycle: number) =>
  Math.pow((1 + Math.cos(Math.PI * 2 * (cycle - 0.15))) / 2, 3);

const SPARKLE_LIFE = 0.3;

const RewardIconLoop: React.FC<RewardIconLoopProps> = ({
  icon,
  iconSize,
  sparkleCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const sway = Math.sin(cycle * Math.PI * 2);
  const breath = Math.sin(cycle * Math.PI * 4);
  const pulse = swell(cycle);

  // Sparkles pop around the top of the rim, staggered, brightest on the swell.
  const sparkles = [];
  for (let i = 0; i < sparkleCount; i++) {
    const p = (cycle + i / sparkleCount + hash(i, 3) * 0.05) % 1;
    if (p > SPARKLE_LIFE) {
      continue;
    }
    const u = p / SPARKLE_LIFE;
    const angle =
      -Math.PI * 0.94 +
      ((i + 0.5) / sparkleCount + (hash(i, 1) - 0.5) * 0.09) * Math.PI * 0.88;
    const radius = 198 + hash(i, 2) * 44;
    const size = (7 + hash(i, 4) * 7) * (0.5 + 0.5 * liveliness);

    sparkles.push({
      key: i,
      x: CX + Math.cos(angle) * radius,
      y: CY + Math.sin(angle) * radius,
      // Snaps open, then eases shut as it drifts a touch further out.
      scale: size * Math.pow(Math.sin(Math.PI * u), 0.55),
      drift: 6 * u,
      rotate: hash(i, 5) * 90,
      opacity: interpolate(u, [0, 0.3, 0.6, 1], [0, 0.3, 0.24, 0]) * liveliness,
    });
  }

  // The tails trail the medal: same swing, delayed, with a slower splay so the
  // two never move as one rigid piece.
  const swing = Math.sin((cycle - 0.09) * Math.PI * 2) * 2.4 * liveliness;
  const splay = Math.sin((cycle - 0.04) * Math.PI * 4) * 1.1 * liveliness;

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: BOX,
    height: BOX,
  };

  const ribbonStyle: React.CSSProperties = {
    ...layerStyle,
    transformOrigin: `${CX}px ${CY}px`,
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          transformOrigin: '50% 20%',
          rotate: `${sway * 0.9 * liveliness}deg`,
          // Volume-preserving squash, so the swell reads without changing bulk.
          scale: `${1 - breath * 0.004 * liveliness} ${
            1 + breath * 0.006 * liveliness
          }`,
          translate: `0px ${
            (Math.cos(cycle * Math.PI * 2) * 3 - pulse * 3) * liveliness
          }px`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: BOX,
            height: BOX,
            transformOrigin: '0 0',
            scale: `${iconSize / BOX}`,
          }}
        >
          {/* Flair sits behind the artwork, so the medal occludes it. */}
          <svg
            style={{...layerStyle, overflow: 'visible'}}
            viewBox={`0 0 ${BOX} ${BOX}`}
          >
            {sparkles.map((sparkle) => (
              <path
                key={`sparkle-${sparkle.key}`}
                d={TWINKLE}
                fill="#000000"
                opacity={sparkle.opacity}
                transform={`translate(${sparkle.x} ${
                  sparkle.y - sparkle.drift
                }) rotate(${sparkle.rotate}) scale(${sparkle.scale})`}
              />
            ))}
          </svg>

          {/* Both tails swing about the medal's centre, so their cut edge stays
              buried under the disk drawn on top of them. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...ribbonStyle,
              clipPath: `path("${RIBBON_LEFT}")`,
              transform: `rotate(${swing + splay}deg)`,
            }}
          />
          <Img
            src={staticFile(icon)}
            style={{
              ...ribbonStyle,
              clipPath: `path("${RIBBON_RIGHT}")`,
              transform: `rotate(${swing - splay}deg)`,
            }}
          />

          {/* The medal itself, swelling very slightly on the beat. Scaling only
              upward guarantees it keeps covering the ribbon cut. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: `path("${MEDAL}")`,
              transformOrigin: `${CX}px ${CY}px`,
              transform: `scale(${1 + pulse * 0.014 * liveliness})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default RewardIconLoop;
