import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  trailCount: z.number().int().min(0).max(6),
  liveliness: z.number().min(0).max(2),
});

export type SpeedIconLoopProps = z.infer<typeof schema>;

export const defaultProps: SpeedIconLoopProps = schema.parse({
  icon: 'speed.png',
  iconSize: 700,
  trailCount: 3,
  liveliness: 1,
});

const BOX = 512;

// Geometry measured off the source icon in its own 512x512 space. The dial ring
// runs from r=180 to the canvas edge and the needle stays inside r=152, so the
// annulus between them is empty: a cut at r=170 separates needle from dial
// without ever crossing ink.
const CX = 256;
const CY = 256;
const CUT_R = 170;

// Centre of the needle's round hub — the point it actually pivots about.
const PX = 233;
const PY = 275;
const REST_ANGLE = -45.9; // needle points up-right at rest

const SWEEP = 42; // degrees of travel at full liveliness
const WIND = 22; // counter-swing coefficient, dips ~6deg below rest
const WOBBLE = 1.6; // high-rev tremor

// Everything except the needle: the outer rect winds clockwise and the inner
// circle counter-clockwise, so the non-zero fill rule punches a hole for it.
const DIAL_CLIP =
  `M0,0 L${BOX},0 L${BOX},${BOX} L0,${BOX} Z ` +
  `M${CX + CUT_R},${CY} ` +
  `A${CUT_R},${CUT_R} 0 1,0 ${CX - CUT_R},${CY} ` +
  `A${CUT_R},${CUT_R} 0 1,0 ${CX + CUT_R},${CY} Z`;
const NEEDLE_CLIP =
  `M${CX + CUT_R},${CY} ` +
  `A${CUT_R},${CUT_R} 0 1,1 ${CX - CUT_R},${CY} ` +
  `A${CUT_R},${CUT_R} 0 1,1 ${CX + CUT_R},${CY} Z`;

// Smooth 0 -> 1 -> 0 over the cycle, time-warped so the needle rushes up and
// drifts back down. Warping the phase keeps it infinitely smooth at the loop
// point, unlike splicing a fast rise onto a slow fall.
const rev = (cycle: number) => {
  const warped = cycle + 0.16 * Math.sin(cycle * Math.PI * 2);
  return (1 - Math.cos(warped * Math.PI * 2)) / 2;
};

// Absolute needle angle for a given point in the cycle. A pure function of the
// cycle, so the trail can simply re-evaluate it in the past.
const needleAngle = (cycle: number, liveliness: number) => {
  const s = rev(cycle);
  const sweep = SWEEP * Math.pow(s, 1.4);
  // Loads up against the stop before the rush, and undershoots on the way back.
  const wind = WIND * 4 * s * Math.pow(1 - s, 5);
  const tremor = WOBBLE * Math.sin(cycle * Math.PI * 6) * Math.pow(s, 3);
  return (sweep - wind + tremor) * liveliness;
};

const arcPath = (r: number, a0: number, a1: number) => {
  const rad = (a: number) => (a * Math.PI) / 180;
  const x0 = PX + r * Math.cos(rad(a0));
  const y0 = PY + r * Math.sin(rad(a0));
  const x1 = PX + r * Math.cos(rad(a1));
  const y1 = PY + r * Math.sin(rad(a1));
  return `M ${x0} ${y0} A ${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${x1} ${y1}`;
};

const SpeedIconLoop: React.FC<SpeedIconLoopProps> = ({
  icon,
  iconSize,
  trailCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const angle = needleAngle(cycle, liveliness);
  const s = rev(cycle);

  // Motion blur read off the needle's own history: streaks are as long as the
  // arc the needle just swept, laid down behind its trailing edge, so they only
  // appear while it is genuinely moving and stretch with how fast it goes.
  const previous = needleAngle((cycle - 1 / durationInFrames + 1) % 1, liveliness);
  const speed = angle - previous;
  const dir = Math.sign(speed) || 1;
  const span = Math.min(15, Math.abs(speed) * 3.5);

  const trails = [];
  for (let i = 0; i < trailCount; i++) {
    if (span < 1.2) {
      break;
    }
    const radius = 164 - i * 24;
    const end = REST_ANGLE + angle - dir * (9 + i * (span + 3));
    const fade = 1 - i / (trailCount + 1);

    trails.push({
      key: i,
      width: 7 - i * 0.5,
      d: arcPath(radius, end - dir * span, end),
      opacity: Math.min(1, Math.abs(speed) / 2.4) * 0.3 * fade * liveliness,
    });
  }

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
          // The dial recoils against the needle it is throwing forward.
          rotate: `${-1.3 * s * liveliness + 0.4 * Math.sin(cycle * Math.PI * 2) * liveliness}deg`,
          scale: `${1 + 0.008 * s * liveliness} ${1 - 0.006 * s * liveliness}`,
          translate: `${-5 * s * liveliness}px ${2 * s * liveliness}px`,
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
          {/* Trail sits behind the artwork, so the needle and dial cover it. */}
          <svg
            style={{...layerStyle, overflow: 'visible'}}
            viewBox={`0 0 ${BOX} ${BOX}`}
          >
            {trails.map((trail) => (
              <path
                key={`trail-${trail.key}`}
                d={trail.d}
                fill="none"
                stroke="#000000"
                strokeWidth={trail.width}
                strokeLinecap="round"
                opacity={trail.opacity}
              />
            ))}
          </svg>

          {/* Dial ring and tick segments, held steady. */}
          <Img
            src={staticFile(icon)}
            style={{...layerStyle, clipPath: `path("${DIAL_CLIP}")`}}
          />

          {/* The needle alone, swinging about its hub. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: `path("${NEEDLE_CLIP}")`,
              transformOrigin: `${PX}px ${PY}px`,
              transform: `rotate(${angle}deg)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default SpeedIconLoop;
