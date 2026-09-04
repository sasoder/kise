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
  cogPitches: z.number().int().min(1).max(8),
  moteCount: z.number().int().min(0).max(8),
  liveliness: z.number().min(0).max(2),
});

export type ThinkingIconLoopProps = z.infer<typeof schema>;

export const defaultProps: ThinkingIconLoopProps = schema.parse({
  icon: 'thinking.png',
  iconSize: 680,
  cogPitches: 2,
  moteCount: 4,
  liveliness: 1,
});

// Measured off the source icon in its own 512x512 space.
const GEAR_X = 280;
const GEAR_Y = 191;
const GEAR_TEETH = 8; // 45deg pitch, so a whole number of pitches loops seamlessly
// The icon leaves a clean empty annulus around the gear (no ink between r=128
// and r=150), so a disc of this radius isolates the gear and nothing else.
const GEAR_DISC = 134;

// Stable per-element scatter: deterministic, so nothing flickers frame to frame.
const hash = (i: number, k: number) => {
  let x = (Math.imul(i + 1, 374761393) + Math.imul(k + 1, 668265263)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

const rise = Easing.out(Easing.quad);

const ThinkingIconLoop: React.FC<ThinkingIconLoopProps> = ({
  icon,
  iconSize,
  cogPitches,
  moteCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  // The gear is the icon's own artwork, isolated and spun in place: the base
  // image gets the disc masked out, and a clipped copy is rotated back into it.
  // Advancing a whole number of tooth pitches per loop hides the seam.
  const cogDeg = cycle * cogPitches * (360 / GEAR_TEETH);

  const scale = iconSize / 512;
  const gx = GEAR_X * scale;
  const gy = GEAR_Y * scale;
  const gr = GEAR_DISC * scale;
  const discMask = `radial-gradient(circle ${gr}px at ${gx}px ${gy}px, transparent 0 ${
    gr - 1
  }px, #000 ${gr}px)`;

  // Thoughts drifting up the inside of the forehead, decelerating as they rise.
  // The path hugs the skull and stays clear of the gear disc.
  const motes = [];
  for (let i = 0; i < moteCount; i++) {
    const phase = i / moteCount;
    const p = (cycle + phase) % 1;
    const t = rise(p);
    const wander = Math.sin(Math.PI * 2 * (p + hash(i, 2)));
    motes.push({
      key: i,
      x:
        interpolate(t, [0, 0.35, 0.62, 1], [122, 124, 120, 200]) +
        (hash(i, 1) * 2 - 1) * 7 +
        wander * 6 * liveliness,
      y: interpolate(t, [0, 0.35, 0.62, 1], [400, 300, 175, 48]),
      r: interpolate(p, [0, 1], [9, 4]),
      opacity:
        interpolate(p, [0, 0.14, 0.7, 1], [0, 1, 0.8, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * 0.6,
    });
  }

  const sway = Math.sin(cycle * Math.PI * 2);
  const breath = Math.sin(cycle * Math.PI * 4);

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          // Pivot at the neck, so the head nods rather than spinning.
          transformOrigin: '50% 96%',
          rotate: `${sway * 0.9 * liveliness}deg`,
          scale: `${1 - breath * 0.005 * liveliness} ${
            1 + breath * 0.009 * liveliness
          }`,
          translate: `0px ${sway * 3 * liveliness}px`,
        }}
      >
        <svg style={{...layerStyle, overflow: 'visible'}} viewBox="0 0 512 512">
          {motes.map((mote) => (
            <circle
              key={`mote-${mote.key}`}
              cx={mote.x}
              cy={mote.y}
              r={mote.r}
              fill="#000000"
              opacity={mote.opacity}
            />
          ))}
        </svg>

        <Img
          src={staticFile(icon)}
          style={{
            ...layerStyle,
            maskImage: discMask,
            WebkitMaskImage: discMask,
          }}
        />

        {/* A circular clip centred on the rotation origin is rotation-invariant,
            so the gear turns inside a hole that never moves. */}
        <div
          style={{
            ...layerStyle,
            clipPath: `circle(${gr}px at ${gx}px ${gy}px)`,
            transformOrigin: `${gx}px ${gy}px`,
            rotate: `${cogDeg}deg`,
          }}
        >
          <Img src={staticFile(icon)} style={layerStyle} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ThinkingIconLoop;
