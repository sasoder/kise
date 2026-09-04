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
  moteCount: z.number().int().min(0).max(16),
  swirl: z.number().min(0).max(6),
  wakeCount: z.number().int().min(0).max(4),
  liveliness: z.number().min(0).max(2),
});

export type UniverseIconLoopProps = z.infer<typeof schema>;

export const defaultProps: UniverseIconLoopProps = schema.parse({
  icon: 'universe.png',
  iconSize: 700,
  moteCount: 9,
  swirl: 1.15,
  wakeCount: 2,
  liveliness: 1,
});

// Geometry measured off the source icon, in its own 512x512 space.
const CX = 256;
const CY = 256;
const CORE = 71; // solid nucleus
const SPAWN = 216; // just inside the arm tips
const SINK = 58; // inside the nucleus, where matter is swallowed
const DIR = 1; // spiral winds clockwise, following the drawn arms

// Stable per-mote scatter: organic spread that never flickers frame to frame.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// One mote's position along its inward spiral. p: 0 = arm tip, 1 = nucleus.
const spiralAt = (i: number, p: number, swirl: number) => {
  const r = interpolate(p, [0, 1], [SPAWN, SINK], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Angular speed climbs as the radius collapses, the way orbits actually do.
  const theta =
    Math.PI * 2 * (hash(i, 0) + DIR * (0.22 * p + swirl * Math.pow(p, 2.4)));
  return {x: CX + r * Math.cos(theta), y: CY + r * Math.sin(theta)};
};

const UniverseIconLoop: React.FC<UniverseIconLoopProps> = ({
  icon,
  iconSize,
  moteCount,
  swirl,
  wakeCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // One normalised cycle drives everything, so the loop has no seam and a
  // different fps or duration resamples the motion instead of retiming it.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const motes = [];
  for (let i = 0; i < moteCount; i++) {
    const p = (cycle + i / moteCount) % 1;
    const here = spiralAt(i, p, swirl);
    const ahead = spiralAt(i, Math.min(1, p + 0.01), swirl);

    // Streaks lie along their own travel, so they stretch into the arms.
    const heading =
      (Math.atan2(ahead.y - here.y, ahead.x - here.x) * 180) / Math.PI;
    const thickness = interpolate(p, [0, 1], [5.6, 3.0]);

    motes.push({
      key: i,
      x: here.x,
      y: here.y,
      rx: thickness * interpolate(p, [0, 1], [1.7, 3.6]),
      ry: thickness,
      heading,
      opacity:
        interpolate(p, [0, 0.12, 0.78, 1], [0, 0.85, 0.7, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) *
        (0.65 + 0.35 * hash(i, 3)),
    });
  }

  // Faint dust wakes trailing the arms: thin arcs sweeping around behind the
  // artwork, so the arms chop them up as they pass.
  const wakes = [];
  for (let i = 0; i < wakeCount; i++) {
    const p = (cycle + i / wakeCount) % 1;
    const r = interpolate(p, [0, 1], [198, 118], {
      easing: Easing.in(Easing.quad),
    });
    const a0 = Math.PI * 2 * (hash(i, 5) + DIR * 0.55 * p);
    const span = 1.25; // ~72 degrees of arc
    wakes.push({
      key: i,
      d: `M ${CX + r * Math.cos(a0)} ${CY + r * Math.sin(a0)} A ${r} ${r} 0 0 ${
        DIR > 0 ? 1 : 0
      } ${CX + r * Math.cos(a0 + DIR * span)} ${
        CY + r * Math.sin(a0 + DIR * span)
      }`,
      width: interpolate(p, [0, 1], [7, 4]),
      opacity: interpolate(p, [0, 0.2, 0.65, 1], [0, 0.16, 0.11, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    });
  }

  // The nucleus breathing out a ring of light, mostly hidden by the arms.
  const halo = {
    r: interpolate(cycle, [0, 1], [CORE + 4, CORE + 62]),
    opacity: interpolate(cycle, [0, 0.25, 1], [0, 0.14, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  };

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
          // A slow lean in the direction of the spin, plus a volume-preserving
          // squash so the disc reads as turning rather than pumping.
          rotate: `${sway * 1.6 * liveliness}deg`,
          scale: `${1 + breath * 0.012 * liveliness} ${
            1 - breath * 0.008 * liveliness
          }`,
          translate: `0px ${Math.cos(cycle * Math.PI * 2) * 3 * liveliness}px`,
        }}
      >
        {/* Behind the icon, so the arms and nucleus occlude the flair. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          <circle
            cx={CX}
            cy={CY}
            r={halo.r}
            fill="none"
            stroke="#000000"
            strokeWidth={6}
            opacity={halo.opacity * liveliness}
          />
          {wakes.map((wake) => (
            <path
              key={`wake-${wake.key}`}
              d={wake.d}
              fill="none"
              stroke="#000000"
              strokeWidth={wake.width}
              strokeLinecap="round"
              opacity={wake.opacity * liveliness}
            />
          ))}
          {motes.map((mote) => (
            <ellipse
              key={`mote-${mote.key}`}
              cx={mote.x}
              cy={mote.y}
              rx={mote.rx}
              ry={mote.ry}
              fill="#000000"
              opacity={mote.opacity * liveliness}
              transform={`rotate(${mote.heading} ${mote.x} ${mote.y})`}
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

export default UniverseIconLoop;
