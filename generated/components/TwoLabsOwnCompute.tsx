import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:03.000 -> 00:00:11.939 of Dylan_Two_Labs2. round(8.939 * 30) = 268.
export const DURATION = 268;

// Two columns, one per lab, in the order he names them. Same 480-wide
// territories the previous scenes used, so the labs keep their side of frame.
const CX = [288, 792];

const HEAD_TOP = 486;
const HEAD_SIZE = 62;
const RULE_Y = 590;
const RULE_HALF = 172;
const RULE_W = 5;

// Compute is drawn as the same rounded cell used in TwoLabsGridCapture, so a
// block here reads as the same substance as the world grid there.
const NCOL = 4;
const NROW = 4;
const CELL = 74;
const GAP = 16;
const PITCH = CELL + GAP;
const BLOCK_W = NCOL * PITCH - GAP;
const BLOCK_TOP = 720;
const BLOCK_BOTTOM = BLOCK_TOP + NROW * PITCH - GAP;
const TOTAL = NCOL * NROW;
const RADIUS = 11;

// Stations hang below the block. Index 0 is shared by both columns, so
// OpenAI's single source sits on the same baseline as Anthropic's first
// partner and the extra rung on the right is the whole asymmetry.
const STATION_Y = [1214, 1436];
const BAR_HALF = 126;
const BAR_H = 7;
const STATION_SIZE = 46;
const LABEL_DY = 30;

const UNIT = 30;
const UNIT_SPEED = 6;
const UNIT_PITCH = 90;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Half-pixel snap with an odd stroke width, or identical rules antialias to
// different alphas and the frame shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

// Packed bottom row first, left to right: compute settles, it does not hang.
const cellCol = (p: number) => p % NCOL;
const cellRow = (p: number) => NROW - 1 - Math.floor(p / NCOL);

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
  accent: z.string(),
  shadow: z.string(),
  slotOpacity: z.number().min(0).max(1),
  cellOpacity: z.number().min(0).max(1),
  pressureOpacity: z.number().min(0).max(1),
  // How far a column recedes while the other one is being talked about.
  restOpacity: z.number().min(0).max(1),
  labels: z.object({
    left: z.string(),
    right: z.string(),
    leftSource: z.string(),
    rightNear: z.string(),
    rightFar: z.string(),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:03.000:
  //     0 "in addition"      ·   9 "openai and"      ·  17 "anthropic"
  //    26 "are also"         ·  33 "starting"        ·  42 "to build"
  //    51 "their own"        ·  69 "openai"          ·  81 "with their"
  //    92 "own chips"        · 121 "anthropic"       · 134 "with tpus that"
  //   161 "purchasing from"  · 190 "google and"      · 216 "deploying with"
  //   230 "fluidstack"       · 253 "and so when you"
  beats: z.object({
    left: z.number().int(),
    right: z.number().int(),
    build: z.number().int(),
    leftTurn: z.number().int(),
    leftSource: z.number().int(),
    leftFill: z.number().int(),
    rightTurn: z.number().int(),
    rightFeed: z.number().int(),
    far: z.number().int(),
    near: z.number().int(),
    settle: z.number().int(),
  }),
});

export type TwoLabsOwnComputeProps = z.infer<typeof schema>;

export const defaultProps: TwoLabsOwnComputeProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  slotOpacity: 0.13,
  cellOpacity: 0.92,
  pressureOpacity: 0.22,
  restOpacity: 0.46,
  labels: {
    left: 'OPENAI',
    right: 'ANTHROPIC',
    leftSource: 'OWN CHIPS',
    rightNear: 'FLUIDSTACK',
    rightFar: 'GOOGLE',
  },
  beats: {
    left: 9,
    right: 17,
    build: 33,
    leftTurn: 69,
    leftSource: 88,
    leftFill: 92,
    rightTurn: 121,
    rightFeed: 130,
    far: 190,
    near: 230,
    settle: 244,
  },
});

const APPEAR_WINDOW = 1.2;
const PRESSURE_LEAD = 3;

const TwoLabsOwnCompute: React.FC<TwoLabsOwnComputeProps> = ({
  ink,
  accent,
  shadow,
  slotOpacity,
  cellOpacity,
  pressureOpacity,
  restOpacity,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ease = (a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});

  const step = (a: number, b: number, delta: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(frame, [a, b], [0, delta], {easing, ...clamp});

  // Attention follows the sentence: both columns are lit while he sets them
  // up, then each recedes while the other one is being described, and both
  // come back for the last beat so the frame resolves on the whole diagram.
  // Attention follows the sentence: a column recedes while the other one is
  // being described, and both come back for the last beat so the frame
  // resolves on the whole diagram rather than on half of it.
  const dip = (down: number, downEnd: number, up: number, upEnd: number) =>
    1 - (1 - restOpacity) * ease(down, downEnd) * (1 - ease(up, upEnd));

  const focus = [
    dip(beats.rightTurn - 10, beats.rightTurn + 6, beats.settle, beats.settle + 16),
    dip(beats.leftTurn - 8, beats.leftTurn + 8, beats.rightTurn - 10, beats.rightTurn + 6),
  ];

  // The cut opens mid-sentence, so the frame must not open empty: both rules
  // are already part-way drawn on frame 0 and the names land on their words.
  const ruleIn = [ease(-16, 6), ease(-10, 12)];
  const headIn = [ease(beats.left, beats.left + 14), ease(beats.right, beats.right + 14)];

  // Their own compute: left is stamped out in one burst on "own chips";
  // right accumulates across three named beats, one surge per partner.
  const counts = [
    step(beats.leftFill, beats.leftFill + 40, TOTAL),
    step(beats.rightFeed + 8, beats.far, 7) +
      step(beats.far, beats.near, 5) +
      step(beats.near, beats.near + 24, TOTAL - 12),
  ];

  // Trunk down from the name, and the supply line below the block.
  const trunkIn = ease(beats.build, beats.build + 18);
  const spurIn = [
    ease(beats.leftSource - 4, beats.leftSource + 14),
    ease(beats.rightFeed, beats.rightFeed + 22),
  ];
  const sourceY = [STATION_Y[0], STATION_Y[1]];

  // How far down each supply line currently reaches. Anthropic's is drawn in
  // two stages — as far as the near station when the flow starts, the rest of
  // the way on "google" — so the chain visibly reaches further out on the word
  // rather than hanging into empty frame for a second and a half beforehand.
  const lineEnd = [
    BLOCK_BOTTOM + (STATION_Y[0] - BLOCK_BOTTOM) * spurIn[0],
    BLOCK_BOTTOM +
      (STATION_Y[0] - BLOCK_BOTTOM) * spurIn[1] +
      (STATION_Y[1] - STATION_Y[0]) * ease(beats.far - 14, beats.far + 6),
  ];

  const stationIn = [
    [ease(beats.leftSource, beats.leftSource + 14), 0],
    [ease(beats.near, beats.near + 14), ease(beats.far, beats.far + 14)],
  ];

  // Everything on the supply line moves at one speed, so Anthropic's longer
  // route simply takes longer — the distance is the point, not a stylisation.
  const activity = [
    Math.min(ease(beats.leftSource + 2, beats.leftSource + 18), 1) * (0.45 + 0.55 * (1 - ease(beats.leftFill + 44, beats.leftFill + 70))),
    Math.min(ease(beats.rightFeed + 10, beats.rightFeed + 26), 1) * (0.45 + 0.55 * (1 - ease(beats.near + 26, beats.near + 52))),
  ];

  const stream = (col: number) => {
    const src = sourceY[col];
    const len = src - BLOCK_BOTTOM - 8;
    const n = Math.max(2, Math.round(len / UNIT_PITCH));
    return Array.from({length: n}, (_, i) => {
      const u = (((frame * UNIT_SPEED) / len + i / n) % 1 + 1) % 1;
      const o =
        Math.min(
          interpolate(u, [0, 0.14], [0, 1], clamp),
          interpolate(u, [0.82, 1], [1, 0], clamp),
        ) * activity[col];
      const y = src - u * len;
      return {y, o: o * interpolate(lineEnd[col] - y, [-6, 10], [0, 1], clamp)};
    });
  };

  const streams = [stream(0), stream(1)];

  // The near station brightens as each unit passes through it — the link is
  // read off the traffic, not off a separate timer.
  const passPulse = (col: number, y: number) =>
    streams[col].reduce(
      (m, u) => Math.max(m, u.o * Math.exp(-(((u.y - y) / 30) ** 2))),
      0,
    );

  // What is about to be built only means anything once that column is
  // actually building; ungated it puts cells on the very first frame.
  const fillGate = [
    ease(beats.leftFill - 8, beats.leftFill + 6),
    ease(beats.rightFeed + 0, beats.rightFeed + 14),
  ];

  const column = (col: number) => {
    const cx = CX[col];
    const count = counts[col];
    const x0 = cx - BLOCK_W / 2;
    const cells = Array.from({length: TOTAL}, (_, p) => {
      const appear = interpolate(count - p, [0, APPEAR_WINDOW], [0, 1], clamp);
      const pressure =
        appear > 0
          ? 0
          : fillGate[col] *
            interpolate(count - p, [-PRESSURE_LEAD, 0], [0, 1], clamp);
      return {
        p,
        appear,
        pressure,
        x: x0 + cellCol(p) * PITCH,
        y: BLOCK_TOP + cellRow(p) * PITCH,
      };
    });
    return {cx, cells};
  };

  const cols = [column(0), column(1)];

  const Cell: React.FC<{
    x: number;
    y: number;
    fill: string;
    opacity: number;
    scale?: number;
  }> = ({x, y, fill, opacity, scale = 1}) => (
    <rect
      x={x + (CELL * (1 - scale)) / 2}
      y={y + (CELL * (1 - scale)) / 2}
      width={CELL * scale}
      height={CELL * scale}
      rx={RADIUS * scale}
      fill={fill}
      opacity={opacity}
    />
  );

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {cols.map((c, col) => {
            const stations = col === 0 ? [STATION_Y[0]] : STATION_Y;
            return (
              <g key={`c${col}`} opacity={focus[col]}>
                {/* The lab. */}
                <line
                  x1={c.cx - RULE_HALF * ruleIn[col]}
                  y1={snap(RULE_Y)}
                  x2={c.cx + RULE_HALF * ruleIn[col]}
                  y2={snap(RULE_Y)}
                  stroke={ink}
                  strokeWidth={RULE_W}
                  strokeLinecap="round"
                  opacity={0.88 * ruleIn[col]}
                />

                {/* Trunk into the block they are building. */}
                <line
                  x1={snap(c.cx)}
                  y1={RULE_Y}
                  x2={snap(c.cx)}
                  y2={RULE_Y + (BLOCK_TOP - RULE_Y) * trunkIn}
                  stroke={accent}
                  strokeWidth={5}
                  opacity={0.8 * trunkIn}
                />

                {/* Supply line down to the source. */}
                <line
                  x1={snap(c.cx)}
                  y1={BLOCK_BOTTOM}
                  x2={snap(c.cx)}
                  y2={lineEnd[col]}
                  stroke={accent}
                  strokeWidth={5}
                  opacity={0.8 * spurIn[col]}
                />

                {/* What is about to be built. */}
                {c.cells.map((cell) => (
                  <Cell
                    key={`s${col}-${cell.p}`}
                    x={cell.x}
                    y={cell.y}
                    fill={ink}
                    opacity={slotOpacity * trunkIn}
                  />
                ))}
                {c.cells
                  .filter((cell) => cell.pressure > 0.002)
                  .map((cell) => (
                    <Cell
                      key={`p${col}-${cell.p}`}
                      x={cell.x}
                      y={cell.y}
                      fill={ink}
                      opacity={pressureOpacity * cell.pressure}
                    />
                  ))}

                {/* Their own compute. */}
                {c.cells
                  .filter((cell) => cell.appear > 0.002)
                  .map((cell) => (
                    <Cell
                      key={`f${col}-${cell.p}`}
                      x={cell.x}
                      y={cell.y}
                      fill={accent}
                      opacity={cellOpacity * cell.appear}
                      scale={0.55 + 0.45 * cell.appear}
                    />
                  ))}

                {/* Hardware on its way in. */}
                {streams[col]
                  .filter((u) => u.o > 0.004)
                  .map((u, i) => (
                    <rect
                      key={`u${col}-${i}`}
                      x={c.cx - UNIT / 2}
                      y={u.y - UNIT / 2}
                      width={UNIT}
                      height={UNIT}
                      rx={5}
                      fill={accent}
                      opacity={0.9 * u.o}
                    />
                  ))}

                {/* Who supplies it. */}
                {stations.map((y, s) => {
                  const on = stationIn[col][s];
                  if (on <= 0.002) return null;
                  const pulse = s === 0 && col === 1 ? passPulse(col, y) : 0;
                  const half = BAR_HALF * (0.6 + 0.4 * on);
                  return (
                    <rect
                      key={`b${col}-${s}`}
                      x={c.cx - half}
                      y={y - BAR_H / 2}
                      width={half * 2}
                      height={BAR_H}
                      rx={BAR_H / 2}
                      fill={ink}
                      opacity={(0.62 + 0.32 * pulse) * on}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>

      <AbsoluteFill style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        {[labels.left, labels.right].map((text, col) => (
          <div
            key={`h${col}`}
            style={{
              position: 'absolute',
              left: CX[col] - 300,
              top: HEAD_TOP,
              width: 600,
              display: 'flex',
              justifyContent: 'center',
              opacity: headIn[col] * focus[col],
              transform: `translateY(${(1 - headIn[col]) * 14}px)`,
            }}
          >
            <span style={typeStyle(HEAD_SIZE, ink)}>{text}</span>
          </div>
        ))}

        {[
          {col: 0, s: 0, text: labels.leftSource},
          {col: 1, s: 0, text: labels.rightNear},
          {col: 1, s: 1, text: labels.rightFar},
        ].map(({col, s, text}) => {
          const on = stationIn[col][s];
          if (on <= 0.002) return null;
          return (
            <div
              key={`sl${col}-${s}`}
              style={{
                position: 'absolute',
                left: CX[col] - 300,
                top: STATION_Y[s] + LABEL_DY,
                width: 600,
                display: 'flex',
                justifyContent: 'center',
                opacity: on * focus[col] * 0.92,
                transform: `translateY(${(1 - on) * 12}px)`,
              }}
            >
              <span style={typeStyle(STATION_SIZE, ink)}>{text}</span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default TwoLabsOwnCompute;
