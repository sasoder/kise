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
  electronCount: z.number().int().min(0).max(6),
  liveliness: z.number().min(0).max(2),
});

export type AtomIconLoopProps = z.infer<typeof schema>;

export const defaultProps: AtomIconLoopProps = schema.parse({
  icon: 'atom.png',
  iconSize: 700,
  electronCount: 3,
  liveliness: 1,
});

// Geometry fitted to the source icon, in its own 512x512 space.
const CX = 256;
const CY = 256;
const RX = 104; // orbit semi-minor: the foreshortened axis
const RY = 227; // orbit semi-major
const ORBITS = [0, 60, 120]; // degrees, matching the three drawn shells
// The shells are the same circle seen at three tilts, so the depth that the
// minor axis stands in for is the part of the circle we cannot see.
const DEPTH = Math.sqrt(1 - (RX / RY) ** 2);

// Stable per-electron scatter so the shells look organic but never flicker.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const AtomIconLoop: React.FC<AtomIconLoopProps> = ({
  icon,
  iconSize,
  electronCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  // One electron per shell, each riding its own ellipse for exactly one
  // revolution per loop. Uniform angular speed is the honest projection of
  // uniform circular motion, so the apparent slow-down at the wide part of
  // each ellipse comes for free.
  const electrons = [];
  for (let i = 0; i < electronCount; i++) {
    const orbit = i % ORBITS.length;
    const theta = (ORBITS[orbit] * Math.PI) / 180;
    // Shells sit 60 degrees apart, so a sixth-turn head start on each keeps the
    // three electrons a third of the way round from each other at every frame.
    const phase = orbit / 6 + Math.floor(i / ORBITS.length) * 0.5;

    const t = Math.PI * 2 * (cycle + phase);
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    const px = RX * Math.cos(t);
    const py = RY * Math.sin(t);

    // Near half of the shell swings toward camera, so it reads slightly larger.
    const near = Math.cos(t) * DEPTH;
    const size = (27 + hash(i, 1) * 3) * (1 + near * 0.17 * liveliness);

    electrons.push({
      key: i,
      x: CX + px * c - py * s,
      y: CY + px * s + py * c,
      r: size,
    });
  }

  const sway = Math.sin(cycle * Math.PI * 2);
  const pulse = Math.sin(cycle * Math.PI * 4);

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
          rotate: `${sway * 1.4 * liveliness}deg`,
          // Volume-preserving squash, as if the shells breathe.
          scale: `${1 + pulse * 0.012 * liveliness} ${
            1 - pulse * 0.008 * liveliness
          }`,
          translate: `0px ${Math.cos(cycle * Math.PI * 2) * 3 * liveliness}px`,
        }}
      >
        <Img
          src={staticFile(icon)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* Electrons ride on top of the shells, the way the drawn ones do. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          {electrons.map((e) => (
            <circle
              key={`electron-${e.key}`}
              cx={e.x}
              cy={e.y}
              r={e.r}
              fill="#000000"
            />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default AtomIconLoop;
