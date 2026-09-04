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
  jabs: z.number().int().min(0).max(4),
  liveliness: z.number().min(0).max(2),
});

export type ChildScoldedIconLoopProps = z.infer<typeof schema>;

export const defaultProps: ChildScoldedIconLoopProps = schema.parse({
  icon: 'child.png',
  iconSize: 680,
  jabs: 2,
  liveliness: 1,
});

const BOX = 512;

// Measured off the source icon in its own 512x512 space. The adult (with the
// pointing arm) and the child never cross this step boundary, so the two can be
// cut apart out of the same artwork and moved independently — no redrawing.
const SPLIT_HIGH = 366; // above the child's shoulders the adult's finger ends at 359
const SPLIT_LOW = 350; // below them the adult's arm has pulled back to 309
const SPLIT_Y = 210;

const ADULT_CLIP = `polygon(0px 0px, ${SPLIT_HIGH}px 0px, ${SPLIT_HIGH}px ${SPLIT_Y}px, ${SPLIT_LOW}px ${SPLIT_Y}px, ${SPLIT_LOW}px ${BOX}px, 0px ${BOX}px)`;
const CHILD_CLIP = `polygon(${SPLIT_HIGH}px 0px, ${BOX}px 0px, ${BOX}px ${BOX}px, ${SPLIT_LOW}px ${BOX}px, ${SPLIT_LOW}px ${SPLIT_Y}px, ${SPLIT_HIGH}px ${SPLIT_Y}px)`;

const ADULT_PIVOT = [158, 502];
const CHILD_PIVOT = [424, 505];

// Fingertip, and the direction the finger points, for the emphasis arcs.
const TIP = [352, 128];
const POINT_DEG = -50;

const JAB_LEN = 0.19; // one telling-off beat
const CHILD_LAG = 0.05; // the flinch arrives just after the jab lands

// Out fast on the point, back slowly as the arm settles.
const strike = (a: number) =>
  a < 0.3
    ? Easing.out(Easing.cubic)(a / 0.3)
    : 1 - Easing.inOut(Easing.quad)((a - 0.3) / 0.7);

// Total jab envelope at a given point in the cycle; jab windows are kept well
// inside [0, 1) so the loop point lands in the quiet settle.
const jabEnvelope = (cycle: number, count: number, lag: number) => {
  let total = 0;
  for (let i = 0; i < count; i++) {
    const a = (cycle - (0.1 + i * 0.3 + lag)) / JAB_LEN;
    if (a > 0 && a < 1) {
      total = Math.max(total, strike(a));
    }
  }
  return total;
};

const polar = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return [TIP[0] + r * Math.cos(rad), TIP[1] + r * Math.sin(rad)];
};

const ChildScoldedIconLoop: React.FC<ChildScoldedIconLoopProps> = ({
  icon,
  iconSize,
  jabs,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const sway = Math.sin(cycle * Math.PI * 2);
  const breath = Math.sin(cycle * Math.PI * 4);

  const jab = jabEnvelope(cycle, jabs, 0);
  const flinch = jabEnvelope(cycle, jabs, CHILD_LAG);

  // The adult leans in over the beat and the arm carries the finger forward.
  const adultRotate = liveliness * (0.5 * sway + 1.2 * jab);
  const adultShift = liveliness * 2 * jab;

  // The child leans away and sinks a little into their shoulders.
  const childRotate = liveliness * (-0.45 * sway + 1.5 * flinch);
  const childSink = liveliness * (2.5 * flinch - 1 * breath);
  const childSquash = 1 - liveliness * 0.014 * flinch;

  // Emphasis arcs off the fingertip, thrown out along the point.
  const arcs = [0, 1].map((i) => {
    const spread = interpolate(jab, [0, 1], [0, 1]);
    const r = 30 + i * 20 + spread * 16;
    const half = 30 - i * 4;
    const [x1, y1] = polar(r, POINT_DEG - half);
    const [x2, y2] = polar(r, POINT_DEG + half);
    return {
      key: i,
      d: `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`,
      width: 9 - i * 2,
      opacity: jab * (0.3 - i * 0.1) * liveliness,
    };
  });

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
          {/* Flair sits behind the artwork, so both figures occlude it. */}
          <svg
            style={{...layerStyle, overflow: 'visible'}}
            viewBox={`0 0 ${BOX} ${BOX}`}
          >
            {arcs.map((arc) => (
              <path
                key={`arc-${arc.key}`}
                d={arc.d}
                fill="none"
                stroke="#000000"
                strokeWidth={arc.width}
                strokeLinecap="round"
                opacity={arc.opacity}
              />
            ))}
          </svg>

          {/* The adult half of the supplied artwork, pivoting on the feet. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: ADULT_CLIP,
              transformOrigin: `${ADULT_PIVOT[0]}px ${ADULT_PIVOT[1]}px`,
              transform: `translate(${adultShift}px, 0px) rotate(${adultRotate}deg) scale(${
                1 + liveliness * 0.004 * breath
              })`,
            }}
          />

          {/* The child half, flinching back a beat later. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: CHILD_CLIP,
              transformOrigin: `${CHILD_PIVOT[0]}px ${CHILD_PIVOT[1]}px`,
              transform: `translate(0px, ${childSink}px) rotate(${childRotate}deg) scale(1, ${childSquash})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ChildScoldedIconLoop;
