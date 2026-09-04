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
  dropCount: z.number().int().min(0).max(8),
  liveliness: z.number().min(0).max(2),
});

export type MoneyIconLoopProps = z.infer<typeof schema>;

export const defaultProps: MoneyIconLoopProps = schema.parse({
  icon: 'money.png',
  iconSize: 700,
  dropCount: 3,
  liveliness: 1,
});

const BOX = 512;

// Geometry measured off the source icon in its own 512x512 space.
// The artwork leaves two fully empty corridors, and every cut below runs
// through one of them, so no clip edge ever crosses ink:
//   rows 122-151  — between the drawstring knot and the bag body
//   cols 322-330  — between the bag and the coin stack
const TIE_CUT = 138; // inside the horizontal corridor
const STACK_CUT = 326; // inside the vertical corridor
const TIE_PIVOT_X = 196; // centre of the bag mouth, just under the knot
const TIE_PIVOT_Y = 150;

// The four coins are rounded bars spanning x 331-511, each ~45px tall with a
// ~30px gap. Clip bands take the gap as slack so a coin can bob inside its own
// band without its edge ever reaching the cut.
const COIN_BANDS: [number, number][] = [
  [228, 301],
  [303, 376],
  [378, 451],
  [453, 560],
];

const rect = (x0: number, y0: number, x1: number, y1: number) =>
  `M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`;

const TIE_CLIP = rect(0, -80, BOX, TIE_CUT);
const BAG_CLIP = rect(-80, TIE_CUT, STACK_CUT, BOX + 80);

// Stable per-coin scatter so the fall looks organic but never flickers.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// One decaying bounce, exactly zero at both ends of its own interval, so the
// stack settles into rest before the next coin lands and the loop has no seam.
const bounce = (q: number) => Math.sin(q * Math.PI * 3) * Math.pow(1 - q, 2.2);

const MoneyIconLoop: React.FC<MoneyIconLoopProps> = ({
  icon,
  iconSize,
  dropCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const sway = Math.sin(cycle * Math.PI * 2);
  const breath = Math.sin(cycle * Math.PI * 4);

  // Coins dropping onto the stack from above, accelerating under gravity and
  // vanishing behind the top coin. They are spaced a whole fall apart, so the
  // landings arrive at an even beat.
  const drops = [];
  for (let i = 0; i < dropCount; i++) {
    const p = (cycle + i / Math.max(1, dropCount)) % 1;
    const y = interpolate(p, [0, 1], [-30, 262], {
      easing: Easing.in(Easing.quad),
    });
    const stretch = interpolate(p, [0, 1], [1, 1.35]);

    drops.push({
      key: i,
      x: 366 + hash(i, 1) * 110,
      y,
      rx: 46 / stretch,
      ry: 13 * stretch,
      opacity:
        interpolate(p, [0, 0.14, 0.9, 1], [0, 0.34, 0.34, 0.24], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * liveliness,
    });
  }

  // Each landing sends a jolt down the stack: the coin struck first moves most,
  // the ones below take it late and damped, like weight settling.
  const beat = (cycle * Math.max(1, dropCount)) % 1;
  const coins = COIN_BANDS.map((band, i) => {
    const q = (beat - i * 0.07 + 1) % 1;
    return {
      band,
      shift: bounce(q) * (3.2 - i * 0.6) * liveliness,
    };
  });

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: BOX,
    height: BOX,
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          transformOrigin: '50% 85%',
          rotate: `${sway * 0.7 * liveliness}deg`,
          // Volume-preserving squash: the bag settles wide as it sinks.
          scale: `${1 + breath * 0.005 * liveliness} ${
            1 - breath * 0.004 * liveliness
          }`,
          translate: `0px ${-Math.cos(cycle * Math.PI * 2) * 3 * liveliness}px`,
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
          {/* Falling coins sit behind the artwork, so the stack swallows them. */}
          <svg
            style={{...layerStyle, overflow: 'visible'}}
            viewBox={`0 0 ${BOX} ${BOX}`}
          >
            {drops.map((drop) => (
              <ellipse
                key={`drop-${drop.key}`}
                cx={drop.x}
                cy={drop.y}
                rx={drop.rx}
                ry={drop.ry}
                fill="#000000"
                opacity={drop.opacity}
              />
            ))}
          </svg>

          {/* The knot swings from the bag mouth, trailing the body's sway. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: `path("${TIE_CLIP}")`,
              transformOrigin: `${TIE_PIVOT_X}px ${TIE_PIVOT_Y}px`,
              transform: `rotate(${
                Math.sin((cycle - 0.1) * Math.PI * 2) * 1.6 * liveliness
              }deg)`,
            }}
          />

          {/* Bag body, everything left of the coin corridor. */}
          <Img
            src={staticFile(icon)}
            style={{...layerStyle, clipPath: `path("${BAG_CLIP}")`}}
          />

          {/* Each coin bobs inside its own band as the stack takes the hit. */}
          {coins.map((coin, i) => (
            <Img
              key={`coin-${i}`}
              src={staticFile(icon)}
              style={{
                ...layerStyle,
                clipPath: `path("${rect(
                  STACK_CUT,
                  coin.band[0],
                  BOX + 80,
                  coin.band[1],
                )}")`,
                transform: `translateY(${coin.shift}px)`,
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default MoneyIconLoop;
