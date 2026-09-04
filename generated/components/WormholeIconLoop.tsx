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
  moteCount: z.number().int().min(0).max(16),
  swirl: z.number().min(0).max(6),
  pulseRings: z.number().int().min(0).max(4),
  liveliness: z.number().min(0).max(2),
});

export type WormholeIconLoopProps = z.infer<typeof schema>;

export const defaultProps: WormholeIconLoopProps = schema.parse({
  icon: 'wormhole.png',
  iconSize: 680,
  moteCount: 7,
  swirl: 2.3,
  pulseRings: 2,
  liveliness: 1,
});

// Geometry traced from the source icon, in its own 512x512 space, so the added
// motion sits exactly on the drawn funnel.
const CX = 256;
const MOUTH_Y = 122;
const THROAT_Y = 438;

// Funnel half-width as a function of descent progress (0 = mouth, 1 = base).
const funnelRx = (s: number) =>
  interpolate(s, [0, 0.3, 0.45, 0.62, 0.8, 1], [232, 74, 56, 34, 20, 42], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// Ellipses read flatter the deeper they sit in the funnel.
const funnelFlatten = (s: number) =>
  interpolate(s, [0, 1], [0.43, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const funnelY = (s: number) => MOUTH_Y + s * (THROAT_Y - MOUTH_Y);

type Mote = {
  key: number;
  x: number;
  y: number;
  r: number;
  opacity: number;
  near: boolean;
};

const WormholeIconLoop: React.FC<WormholeIconLoopProps> = ({
  icon,
  iconSize,
  moteCount,
  swirl,
  pulseRings,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const motes: Mote[] = [];
  for (let i = 0; i < moteCount; i++) {
    const phase = i / moteCount;
    const p = (cycle + phase) % 1;

    // Lingers around the mouth, then falls away quickly.
    const s = Math.pow(p, 1.5);

    // Angular speed rises as the radius collapses, like a real vortex.
    const theta =
      Math.PI * 2 * (phase * 1.37 + 0.55 * p + swirl * Math.pow(p, 2.6));

    // Motes ride just outside the rim at the mouth, then tuck inside the
    // funnel, so they never sit exactly on top of the drawn strokes.
    const rx =
      funnelRx(s) *
      interpolate(s, [0, 0.25, 1], [1.07, 1.0, 0.95], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    const ry = rx * funnelFlatten(s);
    const sinT = Math.sin(theta);

    const fade = interpolate(p, [0, 0.09, 0.78, 1], [0, 1, 0.9, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    // Far half of the orbit sits back a little.
    const depth = 0.55 + 0.45 * ((sinT + 1) / 2);

    motes.push({
      key: i,
      x: CX + rx * Math.cos(theta),
      y: funnelY(s) + ry * sinT,
      r: interpolate(s, [0, 1], [11, 4]),
      opacity: fade * depth,
      near: sinT >= 0,
    });
  }

  const rings = [];
  for (let i = 0; i < pulseRings; i++) {
    const p = (cycle + i / pulseRings) % 1;
    const s = Math.pow(p, 1.25);
    // Held inside the funnel wall and kept faint, so the pulse reads as
    // travelling energy rather than an extra icon stroke.
    const rx = funnelRx(s) * 0.92;
    rings.push({
      key: i,
      cy: funnelY(s),
      rx,
      ry: rx * funnelFlatten(s),
      opacity: interpolate(p, [0, 0.16, 0.45, 0.8], [0, 0.16, 0.1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
      width: interpolate(s, [0, 1], [9, 4]),
    });
  }

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
          rotate: `${sway * 1.1 * liveliness}deg`,
          scale: `${1 - breath * 0.006 * liveliness} ${
            1 + breath * 0.012 * liveliness
          }`,
          translate: `0px ${sway * 4 * liveliness}px`,
        }}
      >
        <svg style={svgStyle} viewBox="0 0 512 512">
          {rings.map((ring) => (
            <ellipse
              key={`ring-${ring.key}`}
              cx={CX}
              cy={ring.cy}
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke="#000000"
              strokeWidth={ring.width}
              opacity={ring.opacity}
            />
          ))}
          {motes
            .filter((mote) => !mote.near)
            .map((mote) => (
              <circle
                key={`far-${mote.key}`}
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
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />

        <svg style={svgStyle} viewBox="0 0 512 512">
          {motes
            .filter((mote) => mote.near)
            .map((mote) => (
              <circle
                key={`near-${mote.key}`}
                cx={mote.x}
                cy={mote.y}
                r={mote.r}
                fill="#000000"
                opacity={mote.opacity}
              />
            ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default WormholeIconLoop;
