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
  beats: z.number().int().min(0).max(4),
  liveliness: z.number().min(0).max(2),
});

export type FamilyIconLoopProps = z.infer<typeof schema>;

export const defaultProps: FamilyIconLoopProps = schema.parse({
  icon: 'family.png',
  iconSize: 680,
  beats: 2,
  liveliness: 1,
});

const BOX = 512;

// Measured off the source icon in its own 512x512 space. The heart and the
// three figures are separate shapes with clear gaps between them, so each can
// be cut out of the same artwork and moved on its own — nothing is redrawn.
// The boundaries below step inward where the figures narrow, and every segment
// runs through empty pixels.
const HEART = `M170,0 H341 V128 H311 V158 H200 V128 H170 Z`;

const LEFT = `M0,0 H210 V256 H182 V371 H157 V${BOX} H0 Z`;
const CHILD = `M210,0 H306 V256 H328 V371 H353 V${BOX} H157 V371 H182 V256 H210 Z`;
const RIGHT = `M306,0 H${BOX} V${BOX} H353 V371 H328 V256 H306 Z`;

// The heart sits inside the figures' bands, so it is punched out of each of
// them as an even-odd hole and drawn on its own layer instead.
const figureClip = (band: string) => `path(evenodd, "${band} ${HEART}")`;
const HEART_CLIP = `path("${HEART}")`;

// Bottom point of the heart: it swells from there, the way it is drawn.
const HEART_TIP = [256, 150];

// Emanation strokes ride an ellipse around the heart's lobes, angled off
// vertical. Straight down is left clear, since the family sits there.
const HEART_HUB = [256, 72];
const HUB_RX = 96;
const HUB_RY = 92;
const RAY_ANGLES = [-118, -74, -32, 32, 74, 118];

const BEAT_LEN = 0.13; // lub-dub, then a long rest before the next one
const DUB_LAG = 0.1;

// Snaps open, relaxes back.
const thump = (a: number) =>
  a < 0.22
    ? Easing.out(Easing.quad)(a / 0.22)
    : 1 - Easing.inOut(Easing.quad)((a - 0.22) / 0.78);

// Beat envelope over the cycle; the windows stay well inside [0, 1) so the
// loop point lands in the rest between beats.
const beatEnvelope = (cycle: number, count: number, lag: number) => {
  let total = 0;
  for (let i = 0; i < count; i++) {
    const a = (cycle - (0.06 + i / Math.max(count, 1) + lag)) / BEAT_LEN;
    if (a > 0 && a < 1) {
      total = Math.max(total, thump(a));
    }
  }
  return total;
};

const FamilyIconLoop: React.FC<FamilyIconLoopProps> = ({
  icon,
  iconSize,
  beats,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const sway = Math.sin(cycle * Math.PI * 2);
  const breath = Math.sin(cycle * Math.PI * 4);

  const lub = beatEnvelope(cycle, beats, 0);
  const dub = beatEnvelope(cycle, beats, DUB_LAG);
  // The second thump is the smaller one, so the pair reads as one heartbeat.
  const pulse = lub + dub * 0.6;

  const heartScale = 1 + liveliness * (0.075 * lub + 0.045 * dub);
  const heartLift = -liveliness * (3 * pulse + 1.5 * breath);

  // Short strokes thrown off the heart on the thump, so the beat carries.
  const rays = RAY_ANGLES.map((deg, i) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    const push = 6 + 16 * pulse * liveliness;
    const inner = [
      HEART_HUB[0] + Math.cos(rad) * (HUB_RX + push),
      HEART_HUB[1] + heartLift + Math.sin(rad) * (HUB_RY + push),
    ];
    const outer = [
      HEART_HUB[0] + Math.cos(rad) * (HUB_RX + push + 20 + 12 * pulse),
      HEART_HUB[1] + heartLift + Math.sin(rad) * (HUB_RY + push + 20 + 12 * pulse),
    ];
    return {
      key: i,
      x1: inner[0],
      y1: inner[1],
      x2: outer[0],
      y2: outer[1],
      opacity:
        interpolate(pulse, [0, 0.3, 1], [0, 0.18, 0.26], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * liveliness,
    };
  });

  // The parents draw in towards the child on the beat; the child lifts a touch.
  const parentLean = liveliness * (0.35 * sway + 0.75 * pulse);
  const childLift = -liveliness * (2.5 * pulse + 1.2 * breath);
  const childScale = 1 + liveliness * 0.008 * pulse;

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
          transformOrigin: '50% 100%',
          rotate: `${sway * 0.5 * liveliness}deg`,
          scale: `${1 - breath * 0.004 * liveliness} ${
            1 + breath * 0.007 * liveliness
          }`,
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
          {/* Flair sits behind the artwork, so the figures occlude it. */}
          <svg
            style={{...layerStyle, overflow: 'visible'}}
            viewBox={`0 0 ${BOX} ${BOX}`}
          >
            {rays.map((ray) => (
              <line
                key={`ray-${ray.key}`}
                x1={ray.x1}
                y1={ray.y1}
                x2={ray.x2}
                y2={ray.y2}
                stroke="#000000"
                strokeWidth={9}
                strokeLinecap="round"
                opacity={ray.opacity}
              />
            ))}
          </svg>

          {/* Each parent leans in from their outside foot. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: figureClip(LEFT),
              transformOrigin: `40px 505px`,
              transform: `rotate(${parentLean}deg)`,
            }}
          />
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: figureClip(RIGHT),
              transformOrigin: `472px 505px`,
              transform: `rotate(${-parentLean}deg)`,
            }}
          />

          {/* The child, rising slightly on each beat. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: figureClip(CHILD),
              transformOrigin: `256px 508px`,
              transform: `translate(0px, ${childLift}px) scale(${childScale})`,
            }}
          />

          {/* The heart, beating above them. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: HEART_CLIP,
              transformOrigin: `${HEART_TIP[0]}px ${HEART_TIP[1]}px`,
              transform: `translate(0px, ${heartLift}px) scale(${heartScale})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default FamilyIconLoop;
