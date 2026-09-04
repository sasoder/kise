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
  glintCount: z.number().int().min(0).max(10),
  liveliness: z.number().min(0).max(2),
});

export type ValuesIconLoopProps = z.infer<typeof schema>;

export const defaultProps: ValuesIconLoopProps = schema.parse({
  icon: 'values.png',
  iconSize: 680,
  glintCount: 5,
  liveliness: 1,
});

// The icon's own 512x512 space. Each sparkle is an isolated shape, so it can be
// cut out of the artwork and moved on its own without any redrawing: the clip
// boxes below are the measured sparkle bounds padded by 3px, and none of them
// contain a single pixel of hand ink.
const BOX = 512;

type Star = {
  cx: number;
  cy: number;
  clip: [number, number, number, number]; // x0, y0, x1, y1
  phase: number;
};

const STARS: Star[] = [
  {cx: 161, cy: 79, clip: [79, 0, 243, 161], phase: 0},
  {cx: 255, cy: 226, clip: [173, 144, 337, 308], phase: 0.36},
  {cx: 350, cy: 79, clip: [268, 0, 432, 161], phase: 0.68},
];

// Cupped-palm opening the glints rise out of.
const BOWL_Y = 424;
const BOWL_X = 256;

const inset = ([x0, y0, x1, y1]: Star['clip']) =>
  `inset(${y0}px ${BOX - x1}px ${BOX - y1}px ${x0}px)`;

// The artwork minus the three sparkles: an outer box with the sparkle boxes
// punched out as even-odd holes, so the hands stay put while the stars move.
const HANDS_CLIP = `path(evenodd, "M0,0 H${BOX} V${BOX} H0 Z ${STARS.map(
  ({clip: [x0, y0, x1, y1]}) =>
    `M${x0},${y0} H${x1} V${y1} H${x0} Z`,
).join(' ')}")`;

// A four-point sparkle with concave sides, matching the drawn ones.
const sparklePath = (r: number) =>
  `M0,${-r} Q0,0 ${r},0 Q0,0 0,${r} Q0,0 ${-r},0 Q0,0 0,${-r} Z`;

// Stable per-element scatter: deterministic, so nothing flickers frame to frame.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const ValuesIconLoop: React.FC<ValuesIconLoopProps> = ({
  icon,
  iconSize,
  glintCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  // Each sparkle drifts on a slow breath and takes one bright twinkle per loop,
  // staggered so exactly one of the three is peaking at any moment.
  const stars = STARS.map((star, i) => {
    const p = (cycle + star.phase) % 1;
    const breath = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
    // Narrow bump: flat most of the cycle, one quick flare at p = 0.5.
    const flare = Math.pow(Math.max(0, Math.sin(p * Math.PI)), 7);
    return {
      key: i,
      ...star,
      flare,
      scale: 1 + liveliness * (0.045 * flare + 0.012 * breath),
      rotate: liveliness * 3.5 * Math.sin(p * Math.PI * 2),
      lift: -liveliness * (3 * breath + 3.5 * flare),
    };
  });

  // Motes of the same light escaping the palms and fading out as they rise.
  const glints = [];
  for (let i = 0; i < glintCount; i++) {
    const p = (cycle + i / glintCount) % 1;
    const lean = hash(i, 1) * 2 - 1;
    const rise = Math.pow(p, 0.85);
    glints.push({
      key: i,
      // Each one leaves on its own arc, so they never stack into a column.
      x:
        BOWL_X +
        lean * (26 + 74 * rise) +
        Math.sin(rise * Math.PI * 1.3 + hash(i, 4) * 6.28) * 16,
      y: BOWL_Y - rise * (120 + hash(i, 2) * 60) * liveliness,
      r: (9 + hash(i, 3) * 5) * (1 - 0.4 * rise),
      rotate: lean * 26 * rise,
      opacity:
        interpolate(p, [0, 0.2, 0.6, 1], [0, 0.42, 0.26, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * liveliness,
    });
  }

  const sway = Math.sin(cycle * Math.PI * 2);
  const breath = Math.sin(cycle * Math.PI * 4);

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
          // Pivot at the wrists, so the offering gesture lifts from the arms.
          transformOrigin: '50% 100%',
          rotate: `${sway * 0.8 * liveliness}deg`,
          scale: `${1 - breath * 0.005 * liveliness} ${
            1 + breath * 0.009 * liveliness
          }`,
          translate: `0px ${(-1.5 - 2.5 * sway) * liveliness}px`,
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
          {/* Flair sits behind the artwork, so the hands and stars occlude it. */}
          <svg style={{...layerStyle, overflow: 'visible'}} viewBox={`0 0 ${BOX} ${BOX}`}>
            {stars.map((star) => (
              // Diagonal spikes that only show in the gaps between the drawn
              // star's points, so the flare reads as the star itself catching.
              <g
                key={`spike-${star.key}`}
                transform={`translate(${star.cx} ${star.cy + star.lift}) rotate(${
                  45 + star.rotate
                })`}
                opacity={star.flare * 0.15}
              >
                {[0, 90, 180, 270].map((a) => (
                  <line
                    key={a}
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={-(44 + 26 * star.flare)}
                    transform={`rotate(${a})`}
                    stroke="#000000"
                    strokeWidth={7}
                    strokeLinecap="round"
                  />
                ))}
              </g>
            ))}
            {glints.map((glint) => (
              <path
                key={`glint-${glint.key}`}
                d={sparklePath(glint.r)}
                transform={`translate(${glint.x} ${glint.y}) rotate(${glint.rotate})`}
                fill="#000000"
                opacity={glint.opacity}
              />
            ))}
          </svg>

          {/* The supplied artwork with the sparkles punched out. */}
          <Img src={staticFile(icon)} style={{...layerStyle, clipPath: HANDS_CLIP}} />

          {/* Each sparkle: the same artwork, cropped to one star and animated. */}
          {stars.map((star) => (
            <Img
              key={`star-${star.key}`}
              src={staticFile(icon)}
              style={{
                ...layerStyle,
                clipPath: inset(star.clip),
                transformOrigin: `${star.cx}px ${star.cy}px`,
                transform: `translate(0px, ${star.lift}px) rotate(${star.rotate}deg) scale(${star.scale})`,
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ValuesIconLoop;
