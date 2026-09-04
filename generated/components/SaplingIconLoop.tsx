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
  breezeCount: z.number().int().min(0).max(6),
  sporeCount: z.number().int().min(0).max(10),
  liveliness: z.number().min(0).max(2),
});

export type SaplingIconLoopProps = z.infer<typeof schema>;

export const defaultProps: SaplingIconLoopProps = schema.parse({
  icon: 'sapling.png',
  iconSize: 700,
  breezeCount: 3,
  sporeCount: 3,
  liveliness: 1,
});

export const FPS = 24;
export const DURATION = 96; // 4s

// Geometry read off the source icon, in its own 512x512 space.
// The stem is a clean 17px column between y=180 and y=220; the soil mound
// starts at y=221 and the pot rim at y=270 (they do not touch).
const STEM_X = 266;
const PIVOT_Y = 234; // just inside the mound, where the stem enters the soil
const PLANT_CUT = 222; // plant layer keeps rows above this
const SOIL_CUT = 220; // soil + pot layer starts here, covering the plant's cut edge

const pct = (v: number) => `${(v / 512) * 100}%`;

// Stable per-element scatter: organic spread, identical every frame.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const SaplingIconLoop: React.FC<SaplingIconLoopProps> = ({
  icon,
  iconSize,
  breezeCount,
  sporeCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;
  const tau = Math.PI * 2;

  // One slow breath plus a lighter second harmonic, so the sway wanders a
  // little instead of metronoming. Both are whole cycles, so the loop is
  // seamless. Negated so the deeper lean runs downwind, with the breeze.
  const lean = -(
    Math.sin(cycle * tau) +
    0.28 * Math.sin(cycle * tau * 2 + 1.1)
  );
  const swayDeg = lean * 2.2 * liveliness;

  // A bent stem is a shorter stem: derive the squash from the lean itself so
  // the two cannot drift apart if the timing changes.
  const bend = Math.abs(lean);
  const plantScaleY = 1 - bend * 0.008 * liveliness;
  const plantScaleX = 1 + bend * 0.005 * liveliness;

  // The pot stays planted; only a whisper of breath on the whole icon.
  const breath = Math.sin(cycle * tau * 2);

  // The breeze that causes the lean: faint streaks crossing behind the plant,
  // arriving a beat before the sway peaks.
  const gusts = [];
  for (let i = 0; i < breezeCount; i++) {
    const p = (cycle + i / breezeCount) % 1;
    // Spread the streaks evenly down the band and jitter them, so they never
    // stack into one continuous rule across the frame.
    const y = 46 + ((i + 0.5) / breezeCount) * 168 + (hash(i, 3) - 0.5) * 34;
    const len = 150 + hash(i, 5) * 90;
    // Long enough to be fully off-canvas at both ends, so a streak always
    // reads as passing behind the plant rather than sprouting from a leaf.
    const x = interpolate(p, [0, 1], [-len - 30, 542]);
    const dip = 8 + hash(i, 7) * 9;
    gusts.push({
      key: i,
      d: `M ${x} ${y} q ${len / 2} ${dip} ${len} ${dip * 0.5}`,
      width: 3.5 + hash(i, 9) * 2,
      opacity:
        interpolate(p, [0, 0.2, 0.8, 1], [0, 0.11, 0.11, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * liveliness,
    });
  }

  // Spores lifting off the leaves and drifting away downwind.
  const spores = [];
  for (let i = 0; i < sporeCount; i++) {
    const p = (cycle + i / sporeCount) % 1;
    const x0 = 150 + hash(i, 11) * 220;
    const y0 = 140 + hash(i, 13) * 55;
    const drift = 70 + hash(i, 17) * 80;
    spores.push({
      key: i,
      cx: x0 + drift * p + Math.sin(p * tau + i) * 10,
      cy: y0 - 130 * p,
      r: interpolate(p, [0, 1], [5, 2.6]),
      opacity:
        interpolate(p, [0, 0.22, 0.7, 1], [0, 0.28, 0.2, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * liveliness,
    });
  }

  const layer: React.CSSProperties = {
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
          // Volume-preserving breath on the whole icon, barely there.
          scale: `${1 + breath * 0.005 * liveliness} ${
            1 - breath * 0.004 * liveliness
          }`,
        }}
      >
        {/* Behind everything, so the plant occludes the breeze passing through it. */}
        <svg style={{...layer, overflow: 'visible'}} viewBox="0 0 512 512">
          <defs>
            {/* Tapered ends, so a streak has no hard start or stop. */}
            <linearGradient id="sapling-gust" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#000000" stopOpacity={0} />
              <stop offset="0.3" stopColor="#000000" stopOpacity={1} />
              <stop offset="0.7" stopColor="#000000" stopOpacity={1} />
              <stop offset="1" stopColor="#000000" stopOpacity={0} />
            </linearGradient>
          </defs>
          {gusts.map((gust) => (
            <path
              key={`gust-${gust.key}`}
              d={gust.d}
              fill="none"
              stroke="url(#sapling-gust)"
              strokeWidth={gust.width}
              strokeLinecap="round"
              opacity={gust.opacity}
            />
          ))}
          {spores.map((spore) => (
            <circle
              key={`spore-${spore.key}`}
              cx={spore.cx}
              cy={spore.cy}
              r={spore.r}
              fill="#000000"
              opacity={spore.opacity}
            />
          ))}
        </svg>

        {/* Leaves and stem, bending about the point where the stem meets the soil. */}
        <Img
          src={staticFile(icon)}
          style={{
            ...layer,
            clipPath: `inset(0 0 ${pct(512 - PLANT_CUT)} 0)`,
            transformOrigin: `${pct(STEM_X)} ${pct(PIVOT_Y)}`,
            rotate: `${swayDeg}deg`,
            scale: `${plantScaleX} ${plantScaleY}`,
          }}
        />

        {/* Soil and pot, dead still, drawn over the plant's cut edge. */}
        <Img
          src={staticFile(icon)}
          style={{
            ...layer,
            clipPath: `inset(${pct(SOIL_CUT)} 0 0 0)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default SaplingIconLoop;
