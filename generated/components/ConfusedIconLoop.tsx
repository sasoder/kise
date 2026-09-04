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
  markCount: z.number().int().min(0).max(8),
  liveliness: z.number().min(0).max(2),
});

export type ConfusedIconLoopProps = z.infer<typeof schema>;

export const defaultProps: ConfusedIconLoopProps = schema.parse({
  icon: 'confused.png',
  iconSize: 720,
  markCount: 2,
  liveliness: 1,
});

// Geometry traced from the source icon, in its own 512x512 space.
// The two drawn question marks sit above the head to the right, so the rising
// ones mirror them up the open corridor on the left, clear of the artwork.
const RISE_X0 = 208; // beside the head, just outside its silhouette
const RISE_Y0 = 118;
const RISE_X1 = 166;
const RISE_Y1 = 16;

// Question mark drawn in local units, baseline-centred on the origin.
const QM_HOOK = 'M -6.2 -6.6 A 6.4 6.4 0 1 1 0.4 1.2 L 0.4 5.4';
const QM_DOT_Y = 10.6;

// Stable per-element scatter so the stream looks organic but never flickers.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const ConfusedIconLoop: React.FC<ConfusedIconLoopProps> = ({
  icon,
  iconSize,
  markCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  // Question marks bubbling up out of the head: buoyant, so they decelerate and
  // spread as they rise, growing and dissolving before they leave the frame.
  const marks = [];
  for (let i = 0; i < markCount; i++) {
    const p = (cycle + i / markCount) % 1;
    const drift = (hash(i, 1) - 0.5) * 16;
    const tilt = (hash(i, 2) - 0.5) * 22;
    const grow = 0.7 + hash(i, 3) * 0.2;

    const rise = interpolate(p, [0, 1], [0, 1], {
      easing: Easing.out(Easing.quad),
    });

    marks.push({
      key: i,
      x:
        interpolate(rise, [0, 1], [RISE_X0, RISE_X1]) +
        drift * rise +
        Math.sin(p * Math.PI * 2 + i) * 4,
      y: interpolate(rise, [0, 1], [RISE_Y0, RISE_Y1]),
      // Wobble on the way up, as if the thought never quite settles.
      rotate: tilt * rise + Math.sin(p * Math.PI * 3 + i * 2) * 5,
      scale: (grow + rise * 0.5) * (0.85 + 0.15 * liveliness),
      opacity: interpolate(p, [0, 0.24, 0.64, 1], [0, 0.3, 0.22, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    });
  }

  const sway = Math.sin(cycle * Math.PI * 2);
  // One slow shrug per loop, zero at both ends so the loop has no seam.
  const shrug = Math.pow(Math.sin(cycle * Math.PI), 6);

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
          rotate: `${sway * 1.6 * liveliness}deg`,
          // Volume-preserving squash: shoulders come up, body settles down.
          scale: `${1 + shrug * 0.016 * liveliness} ${
            1 - shrug * 0.013 * liveliness
          }`,
          translate: `0px ${
            (Math.cos(cycle * Math.PI * 2) * 2.5 - shrug * 4) * liveliness
          }px`,
          transformOrigin: '50% 92%',
        }}
      >
        {/* Behind the icon, so the drawn question marks stay on top. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          {marks.map((mark) => (
            <g
              key={`mark-${mark.key}`}
              transform={`translate(${mark.x} ${mark.y}) rotate(${mark.rotate}) scale(${mark.scale})`}
              opacity={mark.opacity}
            >
              <path
                d={QM_HOOK}
                fill="none"
                stroke="#000000"
                strokeWidth={4.2}
                strokeLinecap="round"
              />
              <circle cx={0.4} cy={QM_DOT_Y} r={2.2} fill="#000000" />
            </g>
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

export default ConfusedIconLoop;
