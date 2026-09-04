import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:29.260 -> 00:00:35.159 of the source cut. round(5.899 * 30) = 177.
// Frame 0 is the last frame of ComputeShiftToday. Runs past "inflect up" to
// cover "i think", so it hands straight on with no gap.
export const DURATION = 177;

// The bar's last move, and the only one that leaves the present. Everything he
// measured today dissolves back into the unknown track, because 2028 is not
// measured — and China, the one thing he will project, re-bases to the origin
// and starts to climb. A measured claim is laid down at one point per frame; a
// projection creeps, and is still moving when the shot ends.

const TRACK_W = 900;
const BAR_H = 150;
const BAR_TOP = 885;
const RADIUS = 16;
const PCT = TRACK_W / 100;

const SCALE_DY = 34;
const SCALE_W = 3;
const TICK_W = 5;
const TICK_UP = 13;
const TICK_DOWN = 9;
const RULE_TICK_W = 3;
const RULE_TICK_UP = 8;
const RULE_TICK_DOWN = 5;

const REST_PARTS = 5;
const REST_GAP = 5;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const snap = (v: number) => Math.round(v) + 0.5;

const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
// Starting to inflect up is an acceleration, so the growth eases in and is
// still gaining when the last frame arrives.
const INFLECT = Easing.in(Easing.quad);

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

const UsField: React.FC<{w: number; h: number}> = ({w, h}) => {
  const stripeH = h / 13;
  const unionW = h * 0.76;
  const unionH = stripeH * 7;
  const starR = h * 0.0308;

  const stars: string[] = [];
  for (let row = 0; row < 9; row++) {
    const count = row % 2 === 0 ? 6 : 5;
    const y = (unionH * (2 * row + 1)) / 18;
    for (let col = 0; col < count; col++) {
      const x =
        row % 2 === 0 ? (unionW * (2 * col + 1)) / 12 : (unionW * (2 * col + 2)) / 12;
      stars.push(starPoints(x, y, starR));
    }
  }

  return (
    <>
      <rect width={w} height={h} fill="#FFFFFF" />
      {Array.from({length: 7}, (_, i) => (
        <rect key={i} y={i * 2 * stripeH} width={w} height={stripeH} fill="#B22234" />
      ))}
      <rect width={unionW} height={unionH} fill="#3C3B6E" />
      {stars.map((points, i) => (
        <polygon key={i} points={points} fill="#FFFFFF" />
      ))}
    </>
  );
};

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

export const schema = z.object({
  ink: z.string(),
  shadow: z.string(),
  trackOpacity: z.number().min(0).max(1),
  restOpacity: z.number().min(0).max(1),
  scaleOpacity: z.number().min(0).max(1),
  rulerOpacity: z.number().min(0).max(1),
  usTickOpacity: z.number().min(0).max(1),
  // The state ComputeShiftToday resolved to. Not editable apart from it.
  start: z.object({us: z.number(), cn: z.number()}),
  // How far the climb gets inside this shot. He gives no number for it — "might
  // start to inflect up" is a direction, so this is small on purpose and is a
  // reading, not a figure he stated.
  inflect: z.number(),
  // Beat frames from the SRT at 30fps, relative to 00:00:29.260:
  //     0 "and as we step"  ·  17 "forward they're" ·  46 "still at a"
  //    64 "very small"      ·  89 "number"          · 106 "so in 2028"
  //   134 "it might"        · 137 "start to"        · 148 "inflect up"
  //   165 "i think"
  beats: z.object({
    verySmall: z.number().int(),
    number: z.number().int(),
    in2028: z.number().int(),
    inflectUp: z.number().int(),
  }),
});

export type ComputeInflect2028Props = z.infer<typeof schema>;

export const defaultProps: ComputeInflect2028Props = schema.parse({
  ink: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  trackOpacity: 0.14,
  restOpacity: 0.3,
  scaleOpacity: 0.72,
  rulerOpacity: 0.4464,
  usTickOpacity: 0.76,
  start: {us: 70, cn: 7},
  inflect: 5,
  beats: {
    verySmall: 64,
    number: 89,
    in2028: 106,
    inflectUp: 148,
  },
});

const ComputeInflect2028: React.FC<ComputeInflect2028Props> = ({
  ink,
  shadow,
  trackOpacity,
  restOpacity,
  scaleOpacity,
  rulerOpacity,
  usTickOpacity,
  start,
  inflect,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const X0 = Math.round((width - TRACK_W) / 2);
  const px = (p: number) => X0 + p * PCT;
  const ramp = (a: number, b: number, easing = EXPO) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});

  const restStart = start.us + start.cn;

  // He turns to China before he leaves the present, so the other two step back
  // first and then keep going all the way out.
  const isolate = ramp(beats.verySmall, beats.number, Easing.inOut(Easing.cubic));
  // 2028 is not measured. Everything measured goes back to the unknown track,
  // which takes the boundary between America and the rest with it — so nothing
  // on screen claims anything about America in 2028.
  const future = ramp(beats.in2028, beats.in2028 + 32);

  const usInk = (1 - 0.3 * isolate) * (1 - future);
  const restInk = restOpacity * (1 - 0.25 * isolate) * (1 - future);
  const rulerInk = rulerOpacity * (1 - future);

  // With the stack gone there is nothing left to stack against, so China
  // re-bases to the origin: from a share of what is left to a share of the
  // whole, measured from zero like everything else eventually is.
  const cnLeft = start.us * (1 - future);
  const cnW =
    start.cn + interpolate(frame, [beats.inflectUp, DURATION - 1], [0, inflect], {
      easing: INFLECT,
      ...clamp,
    });

  const restWidth = (100 - restStart) * PCT;
  const restSeg = (restWidth - REST_GAP * (REST_PARTS - 1)) / REST_PARTS;

  const SCALE_Y = snap(BAR_TOP - SCALE_DY);

  const tick = (
    key: string,
    x: number,
    opacity: number,
    up = TICK_UP,
    down = TICK_DOWN,
    w = TICK_W,
  ) =>
    opacity <= 0.004 ? null : (
      <line
        key={key}
        x1={snap(x)}
        y1={SCALE_Y - up}
        x2={snap(x)}
        y2={SCALE_Y + down}
        stroke={ink}
        strokeWidth={w}
        opacity={opacity}
      />
    );

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id="inflect-us">
            <rect x={0} y={0} width={start.us * PCT} height={BAR_H} rx={RADIUS} />
          </clipPath>
          <clipPath id="inflect-cn">
            <rect x={0} y={0} width={cnW * PCT} height={BAR_H} rx={RADIUS} />
          </clipPath>
          <clipPath id="inflect-rest">
            {Array.from({length: REST_PARTS}, (_, i) => (
              <rect key={i} x={i * (restSeg + REST_GAP)} y={0} width={restSeg} height={BAR_H} />
            ))}
          </clipPath>
        </defs>

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          <rect
            x={X0}
            y={BAR_TOP}
            width={TRACK_W}
            height={BAR_H}
            rx={RADIUS}
            fill={ink}
            opacity={trackOpacity}
          />

          {usInk > 0.004 ? (
            <g transform={`translate(${X0}, ${BAR_TOP})`} opacity={usInk}>
              <g clipPath="url(#inflect-us)">
                <UsField w={start.us * PCT} h={BAR_H} />
              </g>
            </g>
          ) : null}

          {restInk > 0.004 ? (
            <g transform={`translate(${px(restStart)}, ${BAR_TOP})`} clipPath="url(#inflect-rest)">
              <rect
                x={0}
                y={0}
                width={restWidth}
                height={BAR_H}
                rx={RADIUS}
                fill={ink}
                opacity={restInk}
              />
            </g>
          ) : null}

          <g transform={`translate(${px(cnLeft)}, ${BAR_TOP})`}>
            <g clipPath="url(#inflect-cn)">
              <CnField w={35 * PCT} h={BAR_H} />
            </g>
          </g>

          <line
            x1={X0}
            y1={SCALE_Y}
            x2={X0 + TRACK_W}
            y2={SCALE_Y}
            stroke={ink}
            strokeWidth={SCALE_W}
            opacity={scaleOpacity}
          />
          {[10, 20, 30, 40, 50, 60, 80, 90].map((p) =>
            tick(`r${p}`, px(p), rulerInk, RULE_TICK_UP, RULE_TICK_DOWN, RULE_TICK_W),
          )}
          {tick('cnL', px(cnLeft), usTickOpacity)}
          {tick('cnR', px(cnLeft + cnW), scaleOpacity)}
          {tick('cap0', X0, scaleOpacity)}
          {tick('cap1', X0 + TRACK_W, scaleOpacity)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ComputeInflect2028;
