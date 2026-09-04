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
  penGhosts: z.number().int().min(0).max(5),
  penSwing: z.number().min(0).max(6),
  foldCurl: z.number().min(0).max(4),
  sheen: z.number().min(0).max(1),
  liveliness: z.number().min(0).max(2),
});

export type ContractIconLoopProps = z.infer<typeof schema>;

export const defaultProps: ContractIconLoopProps = schema.parse({
  icon: 'contract.png',
  iconSize: 680,
  penGhosts: 3,
  penSwing: 1.5,
  foldCurl: 1.6,
  sheen: 1,
  liveliness: 1,
});

export const FPS = 24;
export const DURATION = 96;

// Geometry traced from the source icon, in its own 512x512 space, so the added
// motion sits exactly on the drawn artwork.

// Pen axis: nib resting on the signature, cap at the top right.
const NIB_X = 300;
const NIB_Y = 398;
const CAP_X = 496;
const CAP_Y = 174;
const PEN_W = 27; // perpendicular thickness of the drawn pen
// Echoes start this far up the shaft, where the artwork is solid, so their
// round cap never pokes out of the white gap around the nib.
const GHOST_START = 55;

// Folded corner: right angle at the bottom left, hypotenuse up to the apex.
const FOLD_APEX = [278, 10];
const FOLD_CORNER = [278, 106];
const FOLD_END = [372, 106];

const ContractIconLoop: React.FC<ContractIconLoopProps> = ({
  icon,
  iconSize,
  penGhosts,
  penSwing,
  foldCurl,
  sheen,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const tau = Math.PI * 2;
  // Slow body sway, once per loop.
  const rock = Math.sin(cycle * tau);
  // Breath at twice that rate so the two never resolve into one motion.
  const breath = Math.sin(cycle * tau * 2);
  // Paper flutter, out of phase with the sway so the corner leads the page.
  const flutter = Math.sin((cycle + 0.18) * tau * 2);

  // Pen axis extended past the cap by each ghost's smear.
  const dx = CAP_X - NIB_X;
  const dy = CAP_Y - NIB_Y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;

  // A pen pivots about its nib while it writes, so the echoes fan out at the
  // cap end and stay pinned where the ink meets the page. Three strokes per
  // loop: the hand signs faster than the page rocks.
  const penAngle = Math.sin(cycle * tau * 3) * penSwing * liveliness;
  const ghosts = [];
  for (let i = 0; i < penGhosts; i++) {
    const lag = (i + 1) * 0.028;
    const angle =
      Math.sin((cycle - lag) * tau * 3) * penSwing * liveliness;
    // Distance from the drawn pen is the smear, so it swells mid-stroke and
    // disappears at the ends of the swing where the nib is momentarily still.
    const smear = Math.abs(angle - penAngle);
    const speed = Math.min(smear / Math.max(penSwing * liveliness * 0.35, 0.001), 1);
    ghosts.push({
      key: i,
      angle,
      overshoot: smear * 1.6,
      opacity: (0.15 - i * 0.035) * speed,
      width: PEN_W - i * 3,
    });
  }

  // The lifted corner throws a hairline of shadow along its own fold.
  const curl = (0.2 + 0.8 * (0.5 + 0.5 * flutter)) * foldCurl * liveliness;

  // The three ruled lines and the signature are knocked out of the artwork, so
  // a soft band passing behind the page shows only through them — a sheen
  // travelling across the paper as it rocks. Held clear of the signature.
  const sheenY = -140 + cycle * 800;

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
          // Pivot low on the page, where it rests against the desk.
          transformOrigin: '18% 100%',
          rotate: `${rock * 0.8 * liveliness}deg`,
          // Volume-preserving squash, so the breath never reads as a zoom.
          scale: `${1 + breath * 0.004 * liveliness} ${
            1 - breath * 0.006 * liveliness
          }`,
          translate: `${rock * 3 * liveliness}px ${
            -Math.abs(rock) * 1.5 * liveliness
          }px`,
        }}
      >
        <svg style={svgStyle} viewBox="0 0 512 512">
          <defs>
            <linearGradient
              id="contract-sheen"
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={sheenY - 110}
              x2={0}
              y2={sheenY + 110}
            >
              <stop offset="0" stopColor="#000000" stopOpacity={0} />
              <stop offset="0.5" stopColor="#000000" stopOpacity={1} />
              <stop offset="1" stopColor="#000000" stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect
            x={0}
            y={140}
            width={392}
            height={195}
            fill="url(#contract-sheen)"
            opacity={0.17 * sheen}
          />
          {ghosts.map((ghost) => (
            <line
              key={`ghost-${ghost.key}`}
              x1={NIB_X + ux * GHOST_START}
              y1={NIB_Y + uy * GHOST_START}
              x2={CAP_X + ux * ghost.overshoot}
              y2={CAP_Y + uy * ghost.overshoot}
              stroke="#000000"
              strokeWidth={ghost.width}
              strokeLinecap="round"
              opacity={ghost.opacity}
              transform={`rotate(${ghost.angle} ${NIB_X} ${NIB_Y})`}
            />
          ))}
          <polygon
            points={`${FOLD_APEX[0]},${FOLD_APEX[1]} ${FOLD_END[0]},${FOLD_END[1]} ${FOLD_CORNER[0]},${FOLD_CORNER[1]}`}
            fill="#000000"
            opacity={0.13}
            transform={`rotate(${curl} ${FOLD_CORNER[0]} ${FOLD_CORNER[1]}) translate(${
              curl * 1.6
            } ${-curl * 1.1})`}
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

export default ContractIconLoop;
