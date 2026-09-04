import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:03.000 -> 00:00:11.939 of Dylan_Two_Labs2. round(8.939 * 30) = 268.
export const DURATION = 268;

const CX = [288, 792];

const HEAD_TOP = 490;
const HEAD_SIZE = 58;
const RULE_Y = 590;
const RULE_HALF = 172;
const RULE_W = 5;

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

const STATION_Y = [1214, 1436];
const BAR_HALF = 126;
const BAR_H = 7;
const STATION_SIZE = 44;
const LABEL_DY = 30;

// Hardware moves at one speed on both routes, so Anthropic's longer chain
// simply takes longer to deliver. It also makes the two streams read
// differently without being drawn differently: OpenAI stamps chips out over a
// short run, so its line is a tight chain; Anthropic's arrive spaced out.
const UNIT = 24;
const SPEED = 12;

const ENTER = 11;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const snap = (v: number) => Math.round(v) + 0.5;

// A little overshoot on the way in. Applied to size only — opacity that
// overshoots reads as a flash, size that overshoots reads as weight.
const backOut = (t: number, s = 1.3) => {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

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
  ambientOpacity: z.number().min(0).max(1),
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
    buildLeft: z.number().int(),
    buildRight: z.number().int(),
    leftTurn: z.number().int(),
    leftSource: z.number().int(),
    leftFill: z.number().int(),
    leftFillEnd: z.number().int(),
    rightTurn: z.number().int(),
    rightFeed: z.number().int(),
    rightFill: z.number().int(),
    far: z.number().int(),
    near: z.number().int(),
    rightFillEnd: z.number().int(),
    settle: z.number().int(),
  }),
});

export type TwoLabsOwnComputeV2Props = z.infer<typeof schema>;

export const defaultProps: TwoLabsOwnComputeV2Props = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  slotOpacity: 0.13,
  cellOpacity: 0.92,
  pressureOpacity: 0.22,
  ambientOpacity: 0.3,
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
    buildLeft: 30,
    buildRight: 38,
    leftTurn: 69,
    leftSource: 82,
    leftFill: 92,
    leftFillEnd: 132,
    rightTurn: 121,
    rightFeed: 121,
    rightFill: 152,
    far: 190,
    near: 230,
    rightFillEnd: 252,
    settle: 244,
  },
});

const PRESSURE_LEAD = 9;

const TwoLabsOwnComputeV2: React.FC<TwoLabsOwnComputeV2Props> = ({
  ink,
  accent,
  shadow,
  slotOpacity,
  cellOpacity,
  pressureOpacity,
  ambientOpacity,
  restOpacity,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const at = (f: number, a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(f, [a, b], [0, 1], {easing, ...clamp});

  const ease = (a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    at(frame, a, b, easing);

  // How many cells each column has built, as a pure function of frame, so the
  // arrival time of any one cell can be recovered from it.
  const countAt = React.useCallback(
    (col: number, f: number) => {
      const step = (a: number, b: number, delta: number, easing = Easing.out(Easing.cubic)) =>
        interpolate(f, [a, b], [0, delta], {easing, ...clamp});
      return col === 0
        ? step(beats.leftFill, beats.leftFillEnd, TOTAL, Easing.bezier(0.16, 1, 0.3, 1))
        : step(beats.rightFill, beats.far, 7) +
            step(beats.far, beats.near, 5) +
            step(beats.near, beats.rightFillEnd, TOTAL - 12);
    },
    [beats],
  );

  // The frame each cell lands on. Everything about a cell — its entrance, the
  // pressure that precedes it, and the unit that carries it up the line — is
  // derived from this one number, so a cell can never land without a delivery
  // and the entrance always takes the same time however fast the fill is
  // running.
  const arrivals = React.useMemo(() => {
    const solve = (col: number, p: number) => {
      // A cell is placed once the count reaches it, i.e. crosses p + 1.
      if (countAt(col, DURATION) < p + 1) return Infinity;
      let lo = 0;
      let hi = DURATION;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (countAt(col, mid) >= p + 1) hi = mid;
        else lo = mid;
      }
      return hi;
    };
    return [0, 1].map((col) => Array.from({length: TOTAL}, (_, p) => solve(col, p)));
  }, [countAt]);

  const dip = (down: number, downEnd: number, up: number, upEnd: number) =>
    1 -
    (1 - restOpacity) *
      ease(down, downEnd, Easing.inOut(Easing.cubic)) *
      (1 - ease(up, upEnd, Easing.inOut(Easing.cubic)));

  const focus = [
    dip(beats.rightTurn - 12, beats.rightTurn + 8, beats.settle, beats.settle + 20),
    dip(beats.leftTurn - 10, beats.leftTurn + 10, beats.rightTurn - 12, beats.rightTurn + 8),
  ];

  const ruleIn = [ease(-16, 6), ease(-10, 12)];
  const headIn = [ease(beats.left, beats.left + 14), ease(beats.right, beats.right + 14)];

  const build = [beats.buildLeft, beats.buildRight];
  const trunkIn = [ease(build[0], build[0] + 20), ease(build[1], build[1] + 20)];

  const spurIn = [
    ease(beats.leftSource - 4, beats.leftSource + 14),
    ease(beats.rightFeed, beats.rightFeed + 20),
  ];
  const sourceY = [STATION_Y[0], STATION_Y[1]];

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

  const travel = sourceY.map((y) => (y - BLOCK_BOTTOM) / SPEED);

  // One unit per cell, timed so it reaches the block on that cell's frame.
  const units = [0, 1].map((col) =>
    Array.from({length: TOTAL}, (_, p) => {
      const a = arrivals[col][p];
      if (!Number.isFinite(a)) return null;
      const depart = a - travel[col];
      if (frame < depart || frame > a) return null;
      const y = sourceY[col] - (frame - depart) * SPEED;
      const o =
        Math.min(
          at(frame, depart, depart + 5),
          1 - at(frame, a - 5, a),
        ) * interpolate(lineEnd[col] - y, [-6, 12], [0, 1], clamp);
      return {y, o};
    }).filter((u): u is {y: number; o: number} => u !== null),
  );

  // The chain does not stop once the block is full — they keep buying.
  const ambient = [0, 1].map((col) => {
    const done = arrivals[col][TOTAL - 1];
    if (!Number.isFinite(done) || frame < done) return [];
    const len = sourceY[col] - BLOCK_BOTTOM;
    const period = len / SPEED;
    const on = at(frame, done, done + 20);
    return [0, 1].map((i) => {
      const u = ((((frame - done) / period + i / 2) % 1) + 1) % 1;
      const y = sourceY[col] - u * len;
      const o =
        Math.min(interpolate(u, [0, 0.12], [0, 1], clamp), interpolate(u, [0.85, 1], [1, 0], clamp)) *
        ambientOpacity *
        on;
      return {y, o};
    });
  });

  const passPulse = (col: number, y: number) =>
    [...units[col], ...ambient[col]].reduce(
      (m, u) => Math.max(m, u.o * Math.exp(-(((u.y - y) / 30) ** 2))),
      0,
    );

  const cells = [0, 1].map((col) =>
    Array.from({length: TOTAL}, (_, p) => {
      const a = arrivals[col][p];
      const appear = Number.isFinite(a) ? at(frame, a, a + ENTER, Easing.out(Easing.cubic)) : 0;
      const pressure = appear > 0 ? 0 : Number.isFinite(a) ? at(frame, a - PRESSURE_LEAD, a) : 0;
      return {
        p,
        appear,
        pressure,
        x: CX[col] - BLOCK_W / 2 + cellCol(p) * PITCH,
        y: BLOCK_TOP + cellRow(p) * PITCH,
      };
    }),
  );

  // The empty block arrives as a wavefront off the trunk rather than as one
  // pop of sixteen tiles.
  const slotIn = (col: number, p: number) => {
    const d = Math.hypot(cellCol(p) - (NCOL - 1) / 2, cellRow(p));
    const t = build[col] + 16 + d * 3.5;
    return at(frame, t, t + 12);
  };

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
          {[0, 1].map((col) => {
            const cx = CX[col];
            const stations = col === 0 ? [STATION_Y[0]] : STATION_Y;
            return (
              <g key={`c${col}`} opacity={focus[col]}>
                <line
                  x1={cx - RULE_HALF * ruleIn[col]}
                  y1={snap(RULE_Y)}
                  x2={cx + RULE_HALF * ruleIn[col]}
                  y2={snap(RULE_Y)}
                  stroke={ink}
                  strokeWidth={RULE_W}
                  strokeLinecap="round"
                  opacity={0.88 * ruleIn[col]}
                />

                <line
                  x1={snap(cx)}
                  y1={RULE_Y}
                  x2={snap(cx)}
                  y2={RULE_Y + (BLOCK_TOP - RULE_Y) * trunkIn[col]}
                  stroke={accent}
                  strokeWidth={5}
                  opacity={0.8 * trunkIn[col]}
                />

                <line
                  x1={snap(cx)}
                  y1={BLOCK_BOTTOM}
                  x2={snap(cx)}
                  y2={lineEnd[col]}
                  stroke={accent}
                  strokeWidth={5}
                  opacity={0.8 * spurIn[col]}
                />

                {cells[col].map((cell) => (
                  <Cell
                    key={`s${col}-${cell.p}`}
                    x={cell.x}
                    y={cell.y}
                    fill={ink}
                    opacity={slotOpacity * slotIn(col, cell.p)}
                  />
                ))}

                {cells[col]
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

                {cells[col]
                  .filter((cell) => cell.appear > 0.002)
                  .map((cell) => (
                    <Cell
                      key={`f${col}-${cell.p}`}
                      x={cell.x}
                      y={cell.y}
                      fill={accent}
                      opacity={cellOpacity * cell.appear}
                      scale={0.52 + 0.48 * backOut(cell.appear)}
                    />
                  ))}

                {[...units[col], ...ambient[col]]
                  .filter((u) => u.o > 0.004)
                  .map((u, i) => (
                    <rect
                      key={`u${col}-${i}`}
                      x={cx - UNIT / 2}
                      y={u.y - UNIT / 2}
                      width={UNIT}
                      height={UNIT}
                      rx={5}
                      fill={accent}
                      opacity={0.9 * u.o}
                    />
                  ))}

                {stations.map((y, s) => {
                  const on = stationIn[col][s];
                  if (on <= 0.002) return null;
                  const pulse = passPulse(col, y);
                  const half = BAR_HALF * (0.6 + 0.4 * on);
                  return (
                    <rect
                      key={`b${col}-${s}`}
                      x={cx - half}
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

export default TwoLabsOwnComputeV2;
