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
  iconColor: z.string(),
  size: z.number().min(100).max(1080),
});

export const defaultProps = schema.parse({
  iconColor: '#000000',
  size: 720,
});

type Props = z.infer<typeof schema>;

// Geometry in a 512x512 viewBox, traced from the source certificate.png
const BADGE_CX = 383;
const BADGE_CY = 310;

const LINES = [
  {x: 130, y: 78, w: 172, h: 34},
  {x: 130, y: 145, w: 172, h: 34},
  {x: 130, y: 212, w: 116, h: 34},
];

const CertificateIconReveal: React.FC<Props> = ({iconColor, size}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Beat 1: paper settles in alone
  const paperOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const paperRise = interpolate(frame, [0, 18], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Beat 2: text lines wipe in left to right, top line first
  const lineProgress = (index: number) =>
    interpolate(frame, [28 + index * 9, 42 + index * 9], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    });

  // Beat 3: badge + ribbon pop; the paper cutout grows with them
  const badgeScale = spring({
    frame: frame - 68,
    fps,
    config: {damping: 12, stiffness: 160, mass: 0.9},
    durationInFrames: 30,
  });

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        style={{overflow: 'visible'}}
      >
        <defs>
          <mask id="paper-cutout">
            <rect x={-40} y={-40} width={592} height={592} fill="white" />
            <g
              transform={`translate(${BADGE_CX} ${BADGE_CY}) scale(${badgeScale}) translate(${-BADGE_CX} ${-BADGE_CY})`}
            >
              <circle cx={BADGE_CX} cy={BADGE_CY} r={126} fill="black" />
              <rect x={288} y={378} width={188} height={150} fill="black" />
            </g>
            {LINES.map((line, i) => (
              <rect
                key={i}
                x={line.x}
                y={line.y}
                width={line.w * lineProgress(i)}
                height={line.h}
                rx={line.h / 2}
                fill="black"
              />
            ))}
          </mask>
          <mask id="badge-cutout">
            <rect x={-40} y={-40} width={592} height={592} fill="white" />
            <path
              d="M 344 316 L 375 340 L 421 276"
              stroke="black"
              strokeWidth={27}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </mask>
        </defs>

        {/* Paper with animated cutouts for the badge and text lines */}
        <g
          mask="url(#paper-cutout)"
          style={{opacity: paperOpacity}}
          transform={`translate(0 ${paperRise})`}
        >
          <rect x={52} y={0} width={353} height={440} rx={56} fill={iconColor} />
        </g>

        {/* Badge coin + ribbon */}
        <g
          transform={`translate(${BADGE_CX} ${BADGE_CY}) scale(${badgeScale}) translate(${-BADGE_CX} ${-BADGE_CY})`}
        >
          <path
            d="M 306 398 L 306 496 Q 306 510 318 503 L 383 466 L 448 503 Q 460 510 460 496 L 460 398 Z"
            fill={iconColor}
          />
          <circle
            cx={BADGE_CX}
            cy={BADGE_CY}
            r={102}
            fill={iconColor}
            mask="url(#badge-cutout)"
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default CertificateIconReveal;
