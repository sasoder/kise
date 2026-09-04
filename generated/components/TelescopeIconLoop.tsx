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
  starCount: z.number().int().min(0).max(7),
  rayCount: z.number().int().min(0).max(12),
  liveliness: z.number().min(0).max(2),
});

export type TelescopeIconLoopProps = z.infer<typeof schema>;

export const defaultProps: TelescopeIconLoopProps = schema.parse({
  icon: 'telescope.png',
  iconSize: 680,
  starCount: 7,
  rayCount: 5,
  liveliness: 1,
});

// Measured off the source icon in its own 512x512 space.
const OBJ_X = 452; // centre of the objective face
const OBJ_Y = 60;
const AIM = (-17.9 * Math.PI) / 180; // tube axis, pointing up-right
const UX = Math.cos(AIM);
const UY = Math.sin(AIM);
const PX = -UY; // perpendicular to the axis
const PY = UX;

// Incoming starlight, measured along the axis outward from the objective.
const RAY_FAR = 132;
const RAY_SPREAD = 82;

const along = (t: number, lateral: number) => ({
  x: OBJ_X + UX * t + PX * lateral,
  y: OBJ_Y + UY * t + PY * lateral,
});

// Placed by hand in the empty wedge above the tube, clear of the artwork, so
// the handful of stars reads as a constellation rather than as scatter.
const CONSTELLATION = [
  {x: 60, y: 120, r: 4.4, opacity: 0.42, phase: 0, sparkle: true},
  {x: 108, y: 52, r: 2.9, opacity: 0.28, phase: 0.37, sparkle: false},
  {x: 152, y: 132, r: 5.2, opacity: 0.5, phase: 0.74, sparkle: true},
  {x: 196, y: 44, r: 3.2, opacity: 0.3, phase: 0.11, sparkle: false},
  {x: 250, y: 96, r: 4.0, opacity: 0.4, phase: 0.48, sparkle: true},
  {x: 300, y: 38, r: 2.7, opacity: 0.26, phase: 0.85, sparkle: false},
  {x: 338, y: 74, r: 3.6, opacity: 0.34, phase: 0.22, sparkle: false},
];

// Stable per-element scatter: deterministic, so nothing flickers frame to frame.
const hash = (i: number, k: number) => {
  let x = (Math.imul(i + 1, 374761393) + Math.imul(k + 1, 668265263)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

// Starlight speeds up as it funnels into the lens.
const converge = Easing.in(Easing.quad);

const TelescopeIconLoop: React.FC<TelescopeIconLoopProps> = ({
  icon,
  iconSize,
  starCount,
  rayCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  // Rays converging on the lens, stretched along their own travel.
  const rays = [];
  for (let i = 0; i < rayCount; i++) {
    const p = (cycle + i / rayCount) % 1;
    const t = interpolate(converge(p), [0, 1], [RAY_FAR, -4]);
    // The offset shrinks with distance, so every ray lands on the lens.
    const lateral = (hash(i, 1) * 2 - 1) * RAY_SPREAD * (t / RAY_FAR);
    const head = along(t, lateral);
    const streak = interpolate(p, [0, 1], [7, 24]) * liveliness;
    rays.push({
      key: i,
      x1: head.x + UX * streak,
      y1: head.y + UY * streak,
      x2: head.x,
      y2: head.y,
      opacity:
        interpolate(p, [0, 0.15, 0.78, 1], [0, 0.9, 0.72, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * 0.5,
    });
  }

  // A held sky: the stars twinkle in place while the scope pans across them.
  const stars = CONSTELLATION.slice(0, starCount).map((star, i) => {
    const twinkle = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (2 * cycle + star.phase));
    const drift = Math.sin(Math.PI * 2 * (cycle + star.phase));
    return {
      key: i,
      x: star.x + drift * 4 * liveliness,
      y: star.y + drift * 2.5 * liveliness,
      r: star.r + twinkle * 1.4 * liveliness,
      opacity: star.opacity * (0.4 + 0.6 * twinkle),
      sparkle: star.sparkle,
    };
  });

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
      <div style={{position: 'relative', width: iconSize, height: iconSize}}>
        <svg style={svgStyle} viewBox="0 0 512 512">
          {stars.map((star) => (
            <g key={`star-${star.key}`} opacity={star.opacity}>
              <circle cx={star.x} cy={star.y} r={star.r} fill="#000000" />
              {star.sparkle ? (
                <path
                  d={`M${star.x - star.r * 3} ${star.y}H${
                    star.x + star.r * 3
                  }M${star.x} ${star.y - star.r * 3}V${star.y + star.r * 3}`}
                  stroke="#000000"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  opacity={0.6}
                />
              ) : null}
            </g>
          ))}
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            // Pivot at the tripod feet, so the legs stay planted and the tube pans.
            transformOrigin: '56% 95%',
            rotate: `${sway * 1.5 * liveliness}deg`,
            scale: `${1 + breath * 0.006 * liveliness} ${
              1 - breath * 0.004 * liveliness
            }`,
          }}
        >
          <svg style={svgStyle} viewBox="0 0 512 512">
            {rays.map((ray) => (
              <line
                key={`ray-${ray.key}`}
                x1={ray.x1}
                y1={ray.y1}
                x2={ray.x2}
                y2={ray.y2}
                stroke="#000000"
                strokeWidth={5}
                strokeLinecap="round"
                opacity={ray.opacity}
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
      </div>
    </AbsoluteFill>
  );
};

export default TelescopeIconLoop;
