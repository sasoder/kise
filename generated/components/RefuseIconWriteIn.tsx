import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  liveliness: z.number().min(0).max(2),
});

export type RefuseIconWriteInProps = z.infer<typeof schema>;

export const defaultProps: RefuseIconWriteInProps = schema.parse({
  icon: "refuse.png",
  iconSize: 700,
  liveliness: 1,
});

export const FPS = 24;
export const DURATION = 96;

const BOX = 512;

// Geometry measured off the source icon's alpha channel, in its own 512x512
// space. The rules, the signature squiggle and the X are transparent cut-outs
// in solid ink, so nothing is redrawn: black "cover" strokes sit on top of the
// PNG and hide each cut-out, and a mask erases those covers back off from left
// to right. What is revealed is always the artwork's own edge.
type Stroke = { d: string; width: number };

const RULES: Stroke[] = [
  { d: "M120,176 H247", width: 32 },
  { d: "M120,240 H295", width: 32 },
  { d: "M120,304 H311", width: 32 },
  // Hand-drawn signature: up, down, up, then a flat run to the right margin.
  { d: "M110,400 L141,373 L175,409 L207,373 L246,400 H288", width: 32 },
];

// X inside the badge: two 31px arms crossing at (383.5, 127.5), cap centres 34
// out along each diagonal.
const CROSSES: Stroke[] = [
  { d: "M359.5,103.5 L407.5,151.5", width: 31 },
  { d: "M359.5,151.5 L407.5,103.5", width: 31 },
];

// The cover has to swallow the cut-out's antialiased edge; the mask has to
// swallow the cover. Both grow outwards from the artwork, never inwards.
const COVER_PAD = 6;
const MASK_PAD = 10;

const RULE_TIMING: [number, number][] = [
  [12, 23],
  [20, 32],
  [28, 41],
  [37, 55],
];

const CROSS_TIMING: [number, number][] = [
  [62, 70],
  [71, 79],
];

// Ink laid down at a steady hand speed, easing off only at the very end.
const WRITE = Easing.bezier(0.32, 0.72, 0.36, 1);
// A crossing-out gesture is a flick: fast out of the gate, hard stop.
const FLICK = Easing.bezier(0.18, 0.85, 0.3, 1);

const RefuseIconWriteIn: React.FC<RefuseIconWriteInProps> = ({
  icon,
  iconSize,
  liveliness,
}) => {
  const frame = useCurrentFrame();

  const entrance = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // A single small recoil when the second arm of the X lands.
  const kick =
    interpolate(frame, [79, 82, 91], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    }) *
    0.015 *
    liveliness;

  const scale = (1 - 0.04 * (1 - entrance) * liveliness) * (1 + kick);

  const progress = (timing: [number, number], easing: (t: number) => number) =>
    interpolate(frame, timing, [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    });

  const strokes: { stroke: Stroke; progress: number }[] = [
    ...RULES.map((stroke, i) => ({
      stroke,
      progress: progress(RULE_TIMING[i], WRITE),
    })),
    ...CROSSES.map((stroke, i) => ({
      stroke,
      progress: progress(CROSS_TIMING[i], FLICK),
    })),
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: iconSize,
          height: iconSize,
          position: "relative",
          opacity: entrance,
          transform: `scale(${scale})`,
        }}
      >
        <Img
          src={staticFile(icon)}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        <svg
          viewBox={`0 0 ${BOX} ${BOX}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <mask
              id="refuse-write-in"
              maskUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={BOX}
              height={BOX}
            >
              <rect x={0} y={0} width={BOX} height={BOX} fill="white" />
              {/* A round-capped dash of zero length still paints a dot, so a
                  stroke that has not started yet is left out entirely. */}
              {strokes.map(({ stroke, progress: p }, i) =>
                p <= 0 ? null : (
                  <path
                    key={`reveal-${i}`}
                    d={stroke.d}
                    fill="none"
                    stroke="black"
                    strokeWidth={stroke.width + MASK_PAD}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray={`${p} 1`}
                  />
                ),
              )}
            </mask>
          </defs>

          {/* Solid ink over every cut-out; the mask wipes it away as each
              stroke is written. */}
          <g mask="url(#refuse-write-in)">
            {strokes.map(({ stroke }, i) => (
              <path
                key={`cover-${i}`}
                d={stroke.d}
                fill="none"
                stroke="#000000"
                strokeWidth={stroke.width + COVER_PAD}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default RefuseIconWriteIn;
