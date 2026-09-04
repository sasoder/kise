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
  signalArcs: z.number().int().min(0).max(4),
  scanStrength: z.number().min(0).max(1),
  liveliness: z.number().min(0).max(2),
});

export type RobotIconLoopProps = z.infer<typeof schema>;

export const defaultProps: RobotIconLoopProps = schema.parse({
  icon: 'robot.png',
  iconSize: 680,
  signalArcs: 3,
  scanStrength: 0.55,
  liveliness: 1,
});

// Geometry measured off the source icon's alpha, in its own 512x512 space.
// The eyes and mouth are transparent cut-outs in an otherwise solid head, so
// anything drawn *behind* the PNG is masked by the artwork and only reads
// through those openings.
const EYE_LEFT = 102;
const EYE_RIGHT = 409;
const EYE_TOP = 124;
const EYE_BOTTOM = 229;

// The antenna stub on the crown, where the broadcast arcs originate.
const ANTENNA_X = 256;
const ANTENNA_Y = 24;
// Half-angle of the broadcast fan, measured from straight up.
const ARC_SPREAD = (55 * Math.PI) / 180;

const arcPath = (r: number) => {
  const x0 = ANTENNA_X - r * Math.sin(ARC_SPREAD);
  const y0 = ANTENNA_Y - r * Math.cos(ARC_SPREAD);
  const x1 = ANTENNA_X + r * Math.sin(ARC_SPREAD);
  const y1 = y0;
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
};

const RobotIconLoop: React.FC<RobotIconLoopProps> = ({
  icon,
  iconSize,
  signalArcs,
  scanStrength,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  // Sensor sweep: a bar tracking down behind the visor. It starts above and
  // finishes below the openings, so the bar is already out of sight by the
  // time it fades, and the eyes are clear at the loop point.
  const scanY = interpolate(cycle, [0, 1], [EYE_TOP - 18, EYE_BOTTOM + 18]);
  const scanFade = interpolate(
    cycle,
    [0, 0.12, 0.62, 0.88],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const scan = scanFade * scanStrength * Math.min(liveliness, 1.4);

  const arcs = [];
  for (let i = 0; i < signalArcs; i++) {
    const p = (cycle + i / signalArcs) % 1;
    // Pulses leave the antenna quickly and coast, the way a ping falls off.
    const s = Math.pow(p, 0.72);
    arcs.push({
      key: i,
      d: arcPath(26 + s * 96),
      width: interpolate(s, [0, 1], [9, 3.5]),
      opacity:
        interpolate(p, [0, 0.1, 0.62, 1], [0, 0.26, 0.13, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * liveliness,
    });
  }

  const sway = Math.sin(cycle * Math.PI * 2);
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
          rotate: `${sway * 1.2 * liveliness}deg`,
          // Volume-preserving squash so the chassis reads as settling rather
          // than zooming.
          scale: `${1 - breath * 0.005 * liveliness} ${
            1 + breath * 0.01 * liveliness
          }`,
          translate: `0px ${sway * 3.5 * liveliness}px`,
        }}
      >
        <svg style={svgStyle} viewBox="0 0 512 512">
          {arcs.map((arc) => (
            <path
              key={`arc-${arc.key}`}
              d={arc.d}
              fill="none"
              stroke="#000000"
              strokeWidth={arc.width}
              strokeLinecap="round"
              opacity={arc.opacity}
            />
          ))}

          {/* Soft halo ahead of the bar, then the bar itself. Both are clipped
              by the opaque head, so only the visor openings light up. */}
          <rect
            x={EYE_LEFT - 6}
            y={scanY - 34}
            width={EYE_RIGHT - EYE_LEFT + 12}
            height={68}
            rx={26}
            fill="#000000"
            opacity={scan * 0.28}
          />
          <rect
            x={EYE_LEFT - 6}
            y={scanY - 13}
            width={EYE_RIGHT - EYE_LEFT + 12}
            height={26}
            rx={13}
            fill="#000000"
            opacity={scan}
          />
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

export default RobotIconLoop;
