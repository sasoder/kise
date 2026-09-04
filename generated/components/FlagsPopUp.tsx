import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  flagWidth: z.number().min(200).max(520),
  gapX: z.number().min(0).max(160),
  gapY: z.number().min(0).max(200),
  cornerRadius: z.number().min(0).max(60),
  staggerFrames: z.number().min(0).max(30),
  liveliness: z.number().min(0).max(2),
  shadow: z.boolean(),
});

export type FlagsPopUpProps = z.infer<typeof schema>;

export const defaultProps: FlagsPopUpProps = schema.parse({
  flagWidth: 430,
  gapX: 50,
  gapY: 84,
  cornerRadius: 22,
  staggerFrames: 9,
  liveliness: 1,
  // Off by default: over alpha, a drop shadow bakes a hard black halo into the
  // matte instead of reading as soft contact shadow.
  shadow: false,
});

// Every flag is drawn in the same 900x600 box so all three read as one set,
// even though their official ratios differ (US is 1.9:1, the others 1.5:1).
const VB_W = 900;
const VB_H = 600;

// Five-point star as a polygon; inner radius is the pentagram ratio so the
// points stay sharp at any size.
const INNER_RATIO = Math.sin(Math.PI / 10) / Math.sin((7 * Math.PI) / 18);

const starPoints = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * INNER_RATIO;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(
        cy +
        radius * Math.sin(angle)
      ).toFixed(2)}`,
    );
  }
  return pts.join(' ');
};

const UsFlag: React.FC = () => {
  const stripeH = VB_H / 13;
  const unionW = VB_W * 0.4;
  const unionH = (VB_H * 7) / 13;
  const starR = VB_H * 0.0308; // half the official 0.0616 star diameter

  const stars: string[] = [];
  for (let row = 0; row < 9; row++) {
    const count = row % 2 === 0 ? 6 : 5;
    const y = (unionH * (2 * row + 1)) / 18;
    for (let col = 0; col < count; col++) {
      const x =
        row % 2 === 0
          ? (unionW * (2 * col + 1)) / 12
          : (unionW * (2 * col + 2)) / 12;
      stars.push(starPoints(x, y, starR));
    }
  }

  return (
    <>
      <rect width={VB_W} height={VB_H} fill="#FFFFFF" />
      {Array.from({length: 7}, (_, i) => (
        <rect
          key={i}
          x={0}
          y={i * 2 * stripeH}
          width={VB_W}
          height={stripeH}
          fill="#B22234"
        />
      ))}
      <rect width={unionW} height={unionH} fill="#3C3B6E" />
      {stars.map((points, i) => (
        <polygon key={i} points={points} fill="#FFFFFF" />
      ))}
    </>
  );
};

const EuFlag: React.FC = () => {
  const cx = VB_W / 2;
  const cy = VB_H / 2;
  const ring = VB_H / 3; // circle of stars: one third of the hoist
  const starR = VB_H / 18;

  return (
    <>
      <rect width={VB_W} height={VB_H} fill="#003399" />
      {Array.from({length: 12}, (_, i) => {
        const angle = -Math.PI / 2 + (i * Math.PI) / 6; // 12 o'clock, clockwise
        return (
          <polygon
            key={i}
            points={starPoints(
              cx + ring * Math.cos(angle),
              cy + ring * Math.sin(angle),
              starR,
            )}
            fill="#FFCC00"
          />
        );
      })}
    </>
  );
};

const RuFlag: React.FC = () => (
  <>
    <rect width={VB_W} height={VB_H / 3} fill="#FFFFFF" />
    <rect y={VB_H / 3} width={VB_W} height={VB_H / 3} fill="#0039A6" />
    <rect y={(VB_H * 2) / 3} width={VB_W} height={VB_H / 3} fill="#D52B1E" />
  </>
);

const FLAGS = [
  {id: 'us', Art: UsFlag},
  {id: 'eu', Art: EuFlag},
  {id: 'ru', Art: RuFlag},
] as const;

const Flag: React.FC<{
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius: number;
  delay: number;
  liveliness: number;
  shadow: boolean;
}> = ({
  index,
  x,
  y,
  width,
  height,
  cornerRadius,
  delay,
  liveliness,
  shadow,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {id, Art} = FLAGS[index];

  // Pop: a light, slightly overshooting spring so each flag lands with weight.
  const pop = spring({
    frame: frame - delay,
    fps,
    config: {damping: 12, mass: 0.7, stiffness: 190},
  });

  const local = frame - delay;
  const opacity = interpolate(local, [0, 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Rises the last few pixels into place as it scales up.
  const lift = interpolate(pop, [0, 1], [26, 0]);
  const scale = interpolate(pop, [0, 1], [0.62, 1]);

  // Once settled, a slow breathing drift keeps the frozen state alive.
  const idleIn = interpolate(local, [10, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const phase = (frame / (fps * 3.4)) * Math.PI * 2 + index * 2.1;
  const float = Math.sin(phase) * 5 * liveliness * idleIn;
  const tilt = Math.sin(phase + 0.9) * 0.7 * liveliness * idleIn;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        opacity,
        translate: `0px ${(lift + float).toFixed(2)}px`,
        rotate: `${tilt.toFixed(3)}deg`,
        scale,
        filter: shadow
          ? 'drop-shadow(0 14px 26px rgba(0,0,0,0.32))'
          : undefined,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={`clip-${id}`}>
            <rect
              width={VB_W}
              height={VB_H}
              rx={(cornerRadius * VB_W) / width}
              ry={(cornerRadius * VB_H) / height}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${id})`}>
          <Art />
        </g>
      </svg>
    </div>
  );
};

const FlagsPopUp: React.FC<FlagsPopUpProps> = ({
  flagWidth,
  gapX,
  gapY,
  cornerRadius,
  staggerFrames,
  liveliness,
  shadow,
}) => {
  const {width, height} = useVideoConfig();
  const flagHeight = (flagWidth * VB_H) / VB_W;

  // Pyramid: one on top, two below. Centred as a group on the canvas.
  const blockH = flagHeight * 2 + gapY;
  const top = (height - blockH) / 2;
  const cx = width / 2;

  const layout = [
    {x: cx - flagWidth / 2, y: top},
    {x: cx - gapX / 2 - flagWidth, y: top + flagHeight + gapY},
    {x: cx + gapX / 2, y: top + flagHeight + gapY},
  ];

  return (
    <AbsoluteFill>
      {layout.map((pos, i) => (
        <Flag
          key={FLAGS[i].id}
          index={i}
          x={pos.x}
          y={pos.y}
          width={flagWidth}
          height={flagHeight}
          cornerRadius={cornerRadius}
          delay={i * staggerFrames}
          liveliness={liveliness}
          shadow={shadow}
        />
      ))}
    </AbsoluteFill>
  );
};

export default FlagsPopUp;
