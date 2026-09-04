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
  ropeGhosts: z.number().int().min(0).max(5),
  ropeSwing: z.number().min(0).max(24),
  shadowStrength: z.number().min(0).max(1),
  liveliness: z.number().min(0).max(2),
});

export type DoormanIconLoopProps = z.infer<typeof schema>;

export const defaultProps: DoormanIconLoopProps = schema.parse({
  icon: 'doorman.png',
  iconSize: 680,
  ropeGhosts: 3,
  ropeSwing: 9,
  shadowStrength: 1,
  liveliness: 1,
});

export const FPS = 24;
export const DURATION = 96;

// Geometry traced from the source icon, in its own 512x512 space, so the added
// motion sits exactly on the drawn artwork.
const ROPE_LEFT_X = 258;
const ROPE_RIGHT_X = 462;
const ROPE_ANCHOR_Y = 252;
const ROPE_SAG = 42; // vertical drop of the drawn rope at its lowest point
const ROPE_WIDTH = 22;

// Ground contacts: the doorman's shoes and the two stanchion feet.
const FEET_CX = 102;
const FEET_Y = 514;
const POST_L_CX = 247;
const POST_R_CX = 472;
const POST_Y = 455;

// Quadratic bezier whose midpoint sits exactly `sag` below the anchors.
const ropePath = (sag: number, drift: number) => {
  const cx = (ROPE_LEFT_X + ROPE_RIGHT_X) / 2 + drift;
  const cy = ROPE_ANCHOR_Y + sag * 2;
  return `M ${ROPE_LEFT_X} ${ROPE_ANCHOR_Y} Q ${cx} ${cy} ${ROPE_RIGHT_X} ${ROPE_ANCHOR_Y}`;
};

const DoormanIconLoop: React.FC<DoormanIconLoopProps> = ({
  icon,
  iconSize,
  ropeGhosts,
  ropeSwing,
  shadowStrength,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const tau = Math.PI * 2;
  // Slow weight shift from one foot to the other, once per loop.
  const shift = Math.sin(cycle * tau);
  // Breath runs at twice that rate so the two never resolve into one motion.
  const breath = Math.sin(cycle * tau * 2);

  // The rope hangs from the same body that is swaying, so it swings on the same
  // clock, lagged — the heavy end of a pendulum always arrives late.
  const ghosts = [];
  for (let i = 0; i < ropeGhosts; i++) {
    // Trailing echoes: each one lags a little further behind the drawn rope.
    const lag = (i + 1) * 0.045;
    const swing = Math.sin((cycle - lag) * tau);
    // Ghosts only ever hang lower than the drawn rope, so what peeks out from
    // behind the artwork reads as the rope's own trailing weight.
    const sag = ROPE_SAG + (0.5 + 0.5 * swing) * ropeSwing * liveliness;
    const drift = -swing * 9 * liveliness;
    ghosts.push({
      key: i,
      d: ropePath(sag, drift),
      opacity: (0.15 - i * 0.035) * (0.45 + 0.55 * Math.abs(swing)),
      width: ROPE_WIDTH - i * 3,
    });
  }

  const shadow = (cx: number, cy: number, rx: number, squash: number) => ({
    cx,
    cy,
    // The contact patch spreads as weight lands on it and narrows as it lifts.
    rx: rx * (1 + shift * squash * 0.06 * liveliness),
    ry: rx * 0.13 * (1 - shift * squash * 0.1 * liveliness),
  });

  const feetShadow = shadow(FEET_CX, FEET_Y, 74, 1);
  const postLShadow = shadow(POST_L_CX, POST_Y, 46, -0.4);
  const postRShadow = shadow(POST_R_CX, POST_Y, 46, -0.4);

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
          // Pivot at the shoes: a standing figure rocks about its feet.
          transformOrigin: `${(FEET_CX / 512) * 100}% 100%`,
          rotate: `${shift * 0.7 * liveliness}deg`,
          // Volume-preserving squash, so the breath never reads as a zoom.
          scale: `${1 + breath * 0.004 * liveliness} ${
            1 - breath * 0.007 * liveliness
          }`,
          translate: `${shift * 3 * liveliness}px ${
            -Math.abs(shift) * 2 * liveliness
          }px`,
        }}
      >
        <svg style={svgStyle} viewBox="0 0 512 512">
          {ghosts.map((ghost) => (
            <path
              key={`ghost-${ghost.key}`}
              d={ghost.d}
              fill="none"
              stroke="#000000"
              strokeWidth={ghost.width}
              strokeLinecap="round"
              opacity={ghost.opacity}
            />
          ))}
          {[feetShadow, postLShadow, postRShadow].map((s, i) => (
            <ellipse
              key={`shadow-${i}`}
              cx={s.cx}
              cy={s.cy}
              rx={s.rx}
              ry={s.ry}
              fill="#000000"
              opacity={(i === 0 ? 0.15 : 0.11) * shadowStrength}
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

export default DoormanIconLoop;
