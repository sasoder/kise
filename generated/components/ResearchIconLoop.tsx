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
  iconSize: z.number().min(240).max(1040),
  lineCount: z.number().int().min(0).max(12),
  liveliness: z.number().min(0).max(2),
});

export type ResearchIconLoopProps = z.infer<typeof schema>;

export const defaultProps: ResearchIconLoopProps = schema.parse({
  iconSize: 700,
  lineCount: 7,
  liveliness: 1,
});

// Lens interior, measured from the artwork in its native 512x512 space. The
// icon leaves it fully transparent, so anything drawn behind reads as what the
// glass is looking at.
const LENS_CX = 341;
const LENS_CY = 383.5;
const LENS_R = 52.5;

// The document's own text bars, seen closer up: three lines sit in the glass at
// once, so it reads as prose rather than as a minus sign.
const BAR_H = 14;
const BAR_GAP = 34;
const BAR_LEFT = LENS_CX - 38;
const BAR_WIDTHS = [72, 46]; // ragged right edge, so it reads as prose
// Two gaps per loop keeps the width pattern in phase — no seam.
const SCROLL = BAR_GAP * BAR_WIDTHS.length;

const ResearchIconLoop: React.FC<ResearchIconLoopProps> = ({
  iconSize,
  lineCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  // Text drifting up through the glass: the lens is reading down the page.
  const drift = cycle * SCROLL * liveliness;
  const bars = [];
  for (let i = 0; i < lineCount; i++) {
    bars.push({
      key: i,
      y: LENS_CY - SCROLL + i * BAR_GAP - drift,
      width: BAR_WIDTHS[i % BAR_WIDTHS.length],
    });
  }

  const sway = Math.sin(cycle * Math.PI * 2);
  const focus = Math.sin(cycle * Math.PI * 4);

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          rotate: `${sway * 1.2 * liveliness}deg`,
          scale: `${1 + sway * 0.008 * liveliness} ${
            1 - sway * 0.005 * liveliness
          }`,
          translate: `0px ${Math.cos(cycle * Math.PI * 2) * 3 * liveliness}px`,
        }}
      >
        {/* Behind the artwork, so only the transparent lens shows it. */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          viewBox="0 0 512 512"
        >
          <defs>
            <clipPath id="research-lens-clip">
              <circle cx={LENS_CX} cy={LENS_CY} r={LENS_R} />
            </clipPath>
          </defs>
          <g clipPath="url(#research-lens-clip)">
            {bars.map((bar) => (
              <rect
                key={`bar-${bar.key}`}
                x={BAR_LEFT}
                y={bar.y - BAR_H / 2}
                width={bar.width}
                height={BAR_H}
                rx={BAR_H / 2}
                fill="#000000"
                opacity={interpolate(
                  Math.abs(bar.y - LENS_CY),
                  [0, LENS_R],
                  [0.88, 0.5],
                  {extrapolateRight: 'clamp'},
                )}
              />
            ))}
          </g>
        </svg>

        <Img
          src={staticFile('research-doc.png')}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
        />

        {/* The glass itself breathes as it pulls focus. */}
        <Img
          src={staticFile('research-lens.png')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            scale: `${1 + focus * 0.012 * liveliness}`,
            transformOrigin: `${(LENS_CX / 512) * 100}% ${
              (LENS_CY / 512) * 100
            }%`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default ResearchIconLoop;
