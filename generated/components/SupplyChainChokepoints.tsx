import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:51.119 -> 00:00:55.939 of the source cut. round(4.820 * 30) = 145.
export const DURATION = 145;

// The mirror of ChinaThirtyGigawatts: there China was a hem at the bottom of
// the world, here it is nearly all of every bar. Same red, opposite result.
// The claim is about breadth, so the graphic enumerates — and then declines to
// stop enumerating, because neither does he.

const TRACK_X = 90;
const TRACK_W = 760;
const BAR_H = 84;
const RADIUS = 12;
const UNIT_PITCH = 210;
const FIRST_BAR_Y = 456;

const GHOST_PITCH = 130;
const FIRST_GHOST_Y = 1240;

const NUM_RIGHT = 990;
const LABEL_SIZE = 58;
const NUM_SIZE = 58;
const HEAD_SIZE = 44;
const HEAD_Y = 290;
const CHIP = 56;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

const barY = (i: number) => FIRST_BAR_Y + i * UNIT_PITCH;
const labelY = (i: number) => barY(i) - LABEL_SIZE - 14;
const ghostY = (i: number) => FIRST_GHOST_Y + i * GHOST_PITCH;

const INNER_RATIO = Math.sin(Math.PI / 10) / Math.sin((7 * Math.PI) / 18);

const starPoints = (cx: number, cy: number, r: number, rotationDeg = 0) => {
  const rot = (rotationDeg * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * INNER_RATIO;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5 + rot;
    pts.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return pts.join(' ');
};

// The same field clipped into the bars of every graphic in this cut, so one
// chip says whose share this is without spending a word on it.
const CnField: React.FC<{w: number; h: number}> = ({w, h}) => {
  const s = h / 60;
  const big = {x: 15 * s, y: 15 * s, r: 9 * s};
  const small = [
    {x: 30 * s, y: 6 * s},
    {x: 36 * s, y: 12 * s},
    {x: 36 * s, y: 21 * s},
    {x: 30 * s, y: 27 * s},
  ];

  return (
    <>
      <rect width={w} height={h} fill="#DE2910" />
      <polygon points={starPoints(big.x, big.y, big.r)} fill="#FFDE00" />
      {small.map((p, i) => {
        const aim = (Math.atan2(big.y - p.y, big.x - p.x) * 180) / Math.PI + 90;
        return <polygon key={i} points={starPoints(p.x, p.y, 3 * s, aim)} fill="#FFDE00" />;
      })}
    </>
  );
};

const typeStyle = (size: number, ink: string): React.CSSProperties => ({
  fontFamily: roboto.fontFamily,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: '0.11em',
  marginRight: '-0.11em',
  whiteSpace: 'nowrap',
  color: ink,
});

export const schema = z.object({
  ink: z.string(),
  china: z.string(),
  shadow: z.string(),
  trackOpacity: z.number().min(0).max(1),
  fillOpacity: z.number().min(0).max(1),
  headOpacity: z.number().min(0).max(1),
  headline: z.string(),
  // All four are IEA 2024, one measure: China's share of global output. Ordered
  // so the fills step rightward and the magnets bar — the input better than 95%
  // of humanoid motors depend on — lands on the word "robotics".
  inputs: z
    .array(
      z.object({
        label: z.string(),
        value: z.number().min(0).max(100),
        labelIn: z.number().int(),
        fillFrom: z.number().int(),
        fillTo: z.number().int(),
      }),
    )
    .length(4),
  // "and other things", twice. Unnamed and unnumbered on purpose: they assert
  // that the list continues, not what the next entries are.
  ghosts: z
    .array(
      z.object({
        value: z.number().min(0).max(100),
        opacity: z.number().min(0).max(1),
        from: z.number().int(),
        to: z.number().int(),
      }),
    )
    .length(3),
  // Beat frames from the SRT at 30fps, relative to 00:00:51.119:
  //     0 "especially"    ·   7 "since they"   ·  15 "control so"
  //    31 "much of"       ·  39 "the supply"   ·  47 "chain and the"
  //    65 "other things"  ·  77 "that we"      ·  85 "needed for"
  //   101 "robotics"      · 117 "and other"    · 131 "things"
  beats: z.object({
    controlSo: z.number().int(),
    theSupply: z.number().int(),
    robotics: z.number().int(),
  }),
});

export type SupplyChainChokepointsProps = z.infer<typeof schema>;

export const defaultProps: SupplyChainChokepointsProps = schema.parse({
  ink: '#FFFFFF',
  china: '#DE2910',
  shadow: 'rgba(0, 0, 0, 0.28)',
  trackOpacity: 0.14,
  fillOpacity: 0.95,
  headOpacity: 0.82,
  headline: 'SHARE OF WORLD OUTPUT',
  inputs: [
    {label: 'BATTERY CELLS', value: 80, labelIn: 43, fillFrom: 47, fillTo: 63},
    {label: 'GRAPHITE ANODE', value: 90, labelIn: 61, fillFrom: 65, fillTo: 81},
    {label: 'RARE-EARTH REFINING', value: 91, labelIn: 81, fillFrom: 85, fillTo: 101},
    {label: 'PERMANENT MAGNETS', value: 94, labelIn: 97, fillFrom: 101, fillTo: 119},
  ],
  ghosts: [
    {value: 88, opacity: 0.5, from: 117, to: 127},
    {value: 93, opacity: 0.3, from: 125, to: 135},
    {value: 85, opacity: 0.16, from: 133, to: 143},
  ],
  beats: {controlSo: 15, theSupply: 39, robotics: 101},
});

const SupplyChainChokepoints: React.FC<SupplyChainChokepointsProps> = ({
  ink,
  china,
  shadow,
  trackOpacity,
  fillOpacity,
  headOpacity,
  headline,
  inputs,
  ghosts,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ramp = (a: number, b: number, easing = EXPO) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});

  const headIn = ramp(beats.controlSo, beats.controlSo + 16);

  // The empty tracks arrive before anything is claimed, staggered down the
  // frame so the shape of the list is legible before the first number lands.
  // The top one is already part-way in at frame 0 — the shot opens mid-word.
  const trackIn = (i: number) => ramp(i * 8 - 6, i * 8 + 10, Easing.out(Easing.cubic));

  const fillOf = (from: number, to: number) =>
    interpolate(frame, [from, to], [0, 1], {easing: EXPO, ...clamp});

  const labelIn = (t: number) => ramp(t, t + 13, Easing.out(Easing.cubic));

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id="chok-chip">
            <rect x={TRACK_X} y={HEAD_Y} width={CHIP} height={CHIP} rx={10} />
          </clipPath>
        </defs>

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          <g clipPath="url(#chok-chip)" opacity={headIn}>
            <g transform={`translate(${TRACK_X}, ${HEAD_Y})`}>
              <CnField w={CHIP} h={CHIP} />
            </g>
          </g>

          {/* What is not China. It is the same sliver every time. */}
          {inputs.map((input, i) => (
            <rect
              key={`t${i}`}
              x={TRACK_X}
              y={barY(i)}
              width={TRACK_W}
              height={BAR_H}
              rx={RADIUS}
              fill={ink}
              opacity={trackOpacity * trackIn(i)}
            />
          ))}

          {inputs.map((input, i) => {
            const p = fillOf(input.fillFrom, input.fillTo);
            const w = TRACK_W * (input.value / 100) * p;
            return w > 1 ? (
              <rect
                key={`f${i}`}
                x={TRACK_X}
                y={barY(i)}
                width={w}
                height={BAR_H}
                rx={RADIUS}
                fill={china}
                opacity={fillOpacity}
              />
            ) : null;
          })}

          {/* The list does not stop when he stops naming it. */}
          {ghosts.map((g, i) => {
            const on = ramp(g.from, g.to, Easing.out(Easing.cubic));
            return (
              <g key={`g${i}`} opacity={on * g.opacity}>
                <rect
                  x={TRACK_X}
                  y={ghostY(i)}
                  width={TRACK_W}
                  height={BAR_H}
                  rx={RADIUS}
                  fill={ink}
                  opacity={trackOpacity}
                />
                <rect
                  x={TRACK_X}
                  y={ghostY(i)}
                  width={TRACK_W * (g.value / 100) * on}
                  height={BAR_H}
                  rx={RADIUS}
                  fill={china}
                  opacity={fillOpacity}
                />
              </g>
            );
          })}
        </g>
      </svg>

      <AbsoluteFill style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        <div
          style={{
            position: 'absolute',
            left: TRACK_X + CHIP + 22,
            top: HEAD_Y + (CHIP - HEAD_SIZE) / 2,
            opacity: headIn * headOpacity,
            transform: `translateY(${(1 - headIn) * 10}px)`,
          }}
        >
          <span style={typeStyle(HEAD_SIZE, ink)}>{headline}</span>
        </div>

        {inputs.map((input, i) => {
          const on = labelIn(input.labelIn);
          const p = fillOf(input.fillFrom, input.fillTo);
          // The number counts with the bar, so the quantity is in the motion as
          // well as in the width it settles at.
          const shown = Math.round(input.value * p);
          const numOn = interpolate(p, [0.06, 0.2], [0, 1], clamp);
          return (
            <React.Fragment key={`type${i}`}>
              <div
                style={{
                  position: 'absolute',
                  left: TRACK_X,
                  top: labelY(i),
                  opacity: on,
                  transform: `translateY(${(1 - on) * 14}px)`,
                }}
              >
                <span style={typeStyle(LABEL_SIZE, ink)}>{input.label}</span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: barY(i) + (BAR_H - NUM_SIZE) / 2,
                  width: NUM_RIGHT,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  opacity: numOn,
                }}
              >
                <span style={typeStyle(NUM_SIZE, ink)}>{shown}%</span>
              </div>
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SupplyChainChokepoints;
