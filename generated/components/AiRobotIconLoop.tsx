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
  pingArcs: z.number().int().min(0).max(4),
  signalStrength: z.number().min(0).max(1),
  liveliness: z.number().min(0).max(2),
});

export type AiRobotIconLoopProps = z.infer<typeof schema>;

export const defaultProps: AiRobotIconLoopProps = schema.parse({
  icon: 'ai-robot.png',
  iconSize: 700,
  pingArcs: 3,
  signalStrength: 0.55,
  liveliness: 1,
});

const BOX = 512;

// Geometry measured off the source icon's alpha, in its own 512x512 space. The
// circuit traces are transparent cut-outs in an otherwise solid head, so
// anything drawn *behind* the PNG is masked by the artwork and only reads
// through the channels — the same trick the robot visor used.
const CX = 214;
const CY = 207;
const RING_R = 41; // open annulus, 35..47, unbroken all the way round the
// solid core disc (r=34) at the centre of the brain
const BRAIN_R = 90; // outer annulus, 85..95, open from -105deg to +8deg
const CUT_R = 41; // separates the core disc from the rest without crossing ink

// The free-standing output node off the right temple.
const NODE_X = 455;
const NODE_Y = 208;

// Channel centrelines, each ~14px wide in the artwork. Every route ends a few
// px underneath solid ink so a pulse slides out of sight instead of stopping.
// `len` is the route's own length, which lets every trail be specified in icon
// units and still come out the same physical size on a long or short route.
type Track = {d: string; len: number};

const SENSOR_UPPER: Track = {d: 'M156,72 H214 V186', len: 172};
const SENSOR_LOWER: Track = {d: 'M109,149 L147,119 H214 V186', len: 182};
const OUTPUT: Track = {d: 'M250,207 H420', len: 170};
const SPINE: Track = {d: 'M218,315 V404 L211,424 L199,439', len: 129};

const rad = (deg: number) => (deg * Math.PI) / 180;

const arcPath = (r: number, a0: number, a1: number) =>
  `M ${CX + r * Math.cos(rad(a0))},${CY + r * Math.sin(rad(a0))} ` +
  `A ${r},${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0},${a1 > a0 ? 1 : 0} ` +
  `${CX + r * Math.cos(rad(a1))},${CY + r * Math.sin(rad(a1))}`;

const BRAIN_TRACK: Track = {
  d: arcPath(BRAIN_R, -105, 8),
  len: (113 * Math.PI * BRAIN_R) / 180,
};
const RING_TRACK: Track = {
  d:
    `M ${CX + RING_R},${CY} ` +
    `A ${RING_R},${RING_R} 0 1,1 ${CX - RING_R},${CY} ` +
    `A ${RING_R},${RING_R} 0 1,1 ${CX + RING_R},${CY}`,
  len: 2 * Math.PI * RING_R,
};

// Everything except the core disc: the outer rect winds clockwise and the inner
// circle counter-clockwise, so the non-zero fill rule punches a hole for it.
const SHELL_CLIP =
  `M0,0 L${BOX},0 L${BOX},${BOX} L0,${BOX} Z ` +
  `M${CX + CUT_R},${CY} ` +
  `A${CUT_R},${CUT_R} 0 1,0 ${CX - CUT_R},${CY} ` +
  `A${CUT_R},${CUT_R} 0 1,0 ${CX + CUT_R},${CY} Z`;
const CORE_CLIP =
  `M${CX + CUT_R},${CY} ` +
  `A${CUT_R},${CUT_R} 0 1,1 ${CX - CUT_R},${CY} ` +
  `A${CUT_R},${CUT_R} 0 1,1 ${CX + CUT_R},${CY} Z`;

// A signal that lives strictly inside (start, end) of the cycle, so it is
// already gone at the loop point. Returns null while it is not running.
const travel = (cycle: number, start: number, end: number) => {
  const p = (cycle - start) / (end - start);
  if (p <= 0 || p >= 1) {
    return null;
  }
  return {
    p: Math.pow(p, 0.88), // eases off as it coasts into its destination
    fade: Math.min(1, p / 0.14) * Math.min(1, (1 - p) / 0.32),
  };
};

// Sharp attack, quadratic decay — a charge landing and bleeding away.
const burst = (cycle: number, start: number, end: number) => {
  const p = (cycle - start) / (end - start);
  if (p <= 0 || p >= 1) {
    return 0;
  }
  return p < 0.18 ? p / 0.18 : Math.pow(1 - (p - 0.18) / 0.82, 2.2);
};

type Comet = {
  id: string;
  track: Track;
  head: number; // leading edge, as a fraction of the route
  unit: number; // length of the brightest chunk, in icon units
  width: number;
  opacity: number; // total darkness at the head
  wrap: boolean; // true only for the closed ring, whose tail crosses the seam
};

// Four dashes sharing a leading edge and reaching progressively further back,
// drawn longest first so the alpha stacks up into a head with a fading tail.
// pathLength=1 puts the dash maths in route fractions regardless of the path.
const TAIL = [5, 3.6, 2.5, 1.7, 1.2, 1];

const comet = ({id, track, head, unit, width, opacity, wrap}: Comet) => {
  const layer = 1 - Math.pow(1 - Math.min(opacity, 0.94), 1 / TAIL.length);
  return TAIL.map((reach, i) => {
    const dash = Math.min(0.98, (unit * reach) / track.len);
    return (
      <path
        key={`${id}-${i}`}
        d={track.d}
        pathLength={1}
        fill="none"
        stroke="#000000"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        // A gap of 2 keeps the pattern from repeating along an open route; the
        // ring wants an exact period of 1 so its tail carries over the seam.
        strokeDasharray={`${dash} ${wrap ? 1 - dash : 2}`}
        strokeDashoffset={dash - head}
        opacity={layer}
      />
    );
  });
};

const AiRobotIconLoop: React.FC<AiRobotIconLoopProps> = ({
  icon,
  iconSize,
  pingArcs,
  signalStrength,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  // The chain of events: both sensors fire inward, the core takes the charge,
  // the thought runs round the outer brain arc, then it leaves down the output
  // trace and the node off the temple pings.
  const upper = travel(cycle, 0.02, 0.4);
  const lower = travel(cycle, 0.1, 0.46);
  const wave = travel(cycle, 0.42, 0.78);
  const output = travel(cycle, 0.5, 0.84);
  const spine = travel(cycle, 0.28, 0.72);
  const ping = travel(cycle, 0.74, 0.99);
  const charge = burst(cycle, 0.36, 0.74);

  const signal = signalStrength * Math.min(liveliness, 1.5);

  const pulses = [
    upper && {id: 'upper', track: SENSOR_UPPER, run: upper},
    lower && {id: 'lower', track: SENSOR_LOWER, run: lower},
    output && {id: 'output', track: OUTPUT, run: output},
    spine && {id: 'spine', track: SPINE, run: spine},
  ].filter(Boolean) as {
    id: string;
    track: Track;
    run: {p: number; fade: number};
  }[];

  const rings = [];
  for (let i = 0; i < pingArcs && ping; i++) {
    rings.push({
      key: i,
      r: 24 + ping.p * 40 + i * 13,
      width: 6 - i * 1.2,
      opacity: ping.fade * signal * 0.3 * (1 - i * 0.3),
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
          rotate: `${sway * 0.9 * liveliness}deg`,
          // Volume-preserving squash, so the head settles rather than zooms.
          scale: `${1 - breath * 0.004 * liveliness} ${
            1 + breath * 0.007 * liveliness
          }`,
          translate: `0px ${sway * 3 * liveliness}px`,
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
          {/* All flair sits behind the artwork, so the solid head clips it down
              to the circuit channels it is running through. */}
          <svg
            style={{...layerStyle, overflow: 'visible'}}
            viewBox={`0 0 ${BOX} ${BOX}`}
          >
            {comet({
              id: 'ring',
              track: RING_TRACK,
              head: cycle,
              unit: 12,
              width: 13,
              opacity: Math.min(0.55, signal * 0.45 * (1 + charge * 0.8)),
              wrap: true,
            })}

            {wave
              ? comet({
                  id: 'wave',
                  track: BRAIN_TRACK,
                  head: wave.p,
                  unit: 12,
                  width: 10,
                  opacity: wave.fade * signal * 0.62,
                  wrap: false,
                })
              : null}

            {pulses.map((pulse) =>
              comet({
                id: pulse.id,
                track: pulse.track,
                head: pulse.run.p,
                unit: 9,
                width: 14,
                opacity: pulse.run.fade * signal * 0.72,
                wrap: false,
              }),
            )}

            {rings.map((ring) => (
              <path
                key={`ping-${ring.key}`}
                d={
                  `M ${NODE_X + ring.r * Math.cos(rad(-52))},${
                    NODE_Y + ring.r * Math.sin(rad(-52))
                  } A ${ring.r},${ring.r} 0 0,1 ` +
                  `${NODE_X + ring.r * Math.cos(rad(52))},${
                    NODE_Y + ring.r * Math.sin(rad(52))
                  }`
                }
                fill="none"
                stroke="#000000"
                strokeWidth={ring.width}
                strokeLinecap="round"
                opacity={ring.opacity}
              />
            ))}
          </svg>

          {/* Head, traces and nodes, held steady. */}
          <Img
            src={staticFile(icon)}
            style={{...layerStyle, clipPath: `path("${SHELL_CLIP}")`}}
          />

          {/* The core disc alone, swelling as the charge lands. */}
          <Img
            src={staticFile(icon)}
            style={{
              ...layerStyle,
              clipPath: `path("${CORE_CLIP}")`,
              transformOrigin: `${CX}px ${CY}px`,
              transform: `scale(${1 + 0.02 * charge * liveliness})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default AiRobotIconLoop;
