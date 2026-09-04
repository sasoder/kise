import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:12.580 -> 00:00:29.260 of the source cut. round(16.680 * 30) = 500.
// Frame 0 is the last frame of ComputeShareFlags2022, so the two butt together
// and the bar never leaves the screen while it changes.
export const DURATION = 500;

// Same track, same grammar: the flag is the bar, a solid field is a committed
// claim and an empty outline is the part of a claim he has not committed to.
// Here the whole thing moves. America takes the top of its own range and then
// shoves; China is crushed between America and the remainder and absorbed into
// it, because this sentence says nothing about China; then it is pulled back
// out of the grey at a number of its own.

const TRACK_W = 900;
const BAR_H = 150;
const BAR_TOP = 885;
const RADIUS = 16;
const PCT = TRACK_W / 100;

const REACH_W = 3;
const REACH_INSET = 12;
const REACH_RADIUS = 10;

const SCALE_DY = 34;
const SCALE_W = 3;
const TICK_W = 5;
const TICK_UP = 13;
const TICK_DOWN = 9;
// Ruler marks are subordinate to the two boundaries they sit between.
const RULE_TICK_W = 3;
const RULE_TICK_UP = 8;
const RULE_TICK_DOWN = 5;

const REST_PARTS = 5;
const REST_GAP = 5;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const snap = (v: number) => Math.round(v) + 0.5;

const EASE = Easing.inOut(Easing.sin);
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

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
  trackOpacity: z.number().min(0).max(1),
  restOpacity: z.number().min(0).max(1),
  reachOpacity: z.number().min(0).max(1),
  scaleOpacity: z.number().min(0).max(1),
  shadow: z.string(),
  // Every value is a percentage of the world's compute. The state at frame 0 is
  // the one ComputeShareFlags2022 resolved to and must not be edited apart.
  start: z.object({us: z.number(), usCap: z.number(), rest: z.number()}),
  // What he actually states here: America 70, China under 10. The remainder is
  // whatever closes the bar, never a number of its own.
  usToday: z.number(),
  cnToday: z.number(),
  cnCeiling: z.number(),
  // Beat frames from the SRT at 30fps, relative to 00:00:12.580:
  //     0 "since 2022"      ·  20 "we've had big"   ·  47 "regulations"
  //    64 "against"         ·  74 "china and a"     · 105 "dramatic"
  //   116 "increase"        · 128 "in america"      · 153 "so today 70 of"
  //   212 "watts are being" · 228 "deployed"        · 238 "in america"
  //   260 "and china"       · 277 "is really"       · 308 "a very small"
  //   349 "number"          · 363 "it's sub 10 of"  · 393 "watts being"
  //   407 "deployed"        · 421 "for data"        · 443 "center ai"
  //   463 "compute is"      · 490 "in china"
  beats: z.object({
    against: z.number().int(),
    china: z.number().int(),
    increase: z.number().int(),
    inAmerica: z.number().int(),
    seventy: z.number().int(),
    andChina: z.number().int(),
    verySmall: z.number().int(),
    number: z.number().int(),
    subTen: z.number().int(),
    wattsBeing: z.number().int(),
    dataCenter: z.number().int(),
    inChina: z.number().int(),
  }),
});

export type ComputeShiftTodayProps = z.infer<typeof schema>;

export const defaultProps: ComputeShiftTodayProps = schema.parse({
  ink: '#FFFFFF',
  trackOpacity: 0.14,
  restOpacity: 0.3,
  reachOpacity: 0.55,
  scaleOpacity: 0.42,
  shadow: 'rgba(0, 0, 0, 0.28)',
  start: {us: 45, usCap: 5, rest: 85},
  usToday: 70,
  cnToday: 7,
  cnCeiling: 10,
  beats: {
    against: 64,
    china: 74,
    increase: 116,
    inAmerica: 128,
    seventy: 180,
    andChina: 260,
    verySmall: 308,
    number: 349,
    subTen: 363,
    wattsBeing: 393,
    dataCenter: 421,
    inChina: 490,
  },
});

const ComputeShiftToday: React.FC<ComputeShiftTodayProps> = ({
  ink,
  trackOpacity,
  restOpacity,
  reachOpacity,
  scaleOpacity,
  shadow,
  start,
  usToday,
  cnToday,
  cnCeiling,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const X0 = Math.round((width - TRACK_W) / 2);
  const px = (p: number) => X0 + p * PCT;

  const ramp = (a: number, b: number, easing = EXPO) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});
  const grow = (a: number, b: number, d: number) =>
    interpolate(frame, [a, b], [0, d], {easing: EASE, ...clamp});

  // One point per frame for a committed claim, half that through a range: the
  // uncommitted part of a number is laid down at half the speed of the part he
  // will stand behind. Every run is scheduled backwards from the word it lands
  // on, so the rate decides the start.
  const cap0 = start.usCap;
  const usGain = usToday - (start.us + cap0);
  const surge0 = beats.seventy - usGain;
  const fillUs0 = beats.inAmerica - cap0 * 2;
  const cnLoss0 = beats.china - cap0 * 2;
  const emerge0 = beats.number - cnToday;

  // --- three scalars carry the whole scene ---------------------------------
  // America's committed edge: it takes the top of its own range on "in
  // america", then shoves.
  const usSolid =
    start.us + grow(fillUs0, beats.inAmerica, cap0) + grow(surge0, beats.seventy, usGain);
  // What America has not committed to. Reaches zero as the flag fills it.
  const usCapW = Math.max(0, start.us + cap0 - usSolid);
  // The remainder's left edge. It takes China's lost upside, yields to the
  // surge, and gives ground back when China is named again.
  const restLeft =
    start.rest -
    grow(cnLoss0, beats.china, cap0) -
    grow(surge0, beats.seventy, start.rest - cap0 - usToday) +
    grow(emerge0, beats.number, cnToday);
  // China's own uncommitted room: five points of upside regulated away, then a
  // ceiling of its own once he says "sub 10".
  const cnCapW = cap0 - grow(cnLoss0, beats.china, cap0);

  // China occupies whatever is left between the two of them, which is how it
  // gets crushed: both edges close on it at once.
  const cnLeft = Math.max(start.us + cap0, usSolid);
  const cnW = Math.max(0, restLeft - cnLeft - cnCapW);

  // Crushed is not deleted. The flag cross-fades into the grey it is being
  // pushed into, so the 30% that is left visibly still contains it.
  const absorb = ramp(surge0 + 8, beats.seventy, Easing.inOut(Easing.cubic));
  const reemerge = ramp(emerge0 - 2, beats.number, Easing.out(Easing.cubic));
  const cnInk = 1 - absorb * (1 - reemerge);
  // He names China long before he sizes it. The grey holding it warms first.
  const held = ramp(beats.andChina, beats.andChina + 16) * (1 - reemerge);

  // Nothing is said about the rest of the world here, so it steps back while
  // the two of them are compared, and comes up again at the end.
  const restDim = 0.4 * ramp(beats.wattsBeing, beats.wattsBeing + 18) * (1 - ramp(beats.inChina, beats.inChina + 12));
  const restInk = restOpacity * (1 - restDim);

  const SCALE_Y = snap(BAR_TOP - SCALE_DY);
  const scaleInk = 0.72;
  const restWidth = (100 - restLeft) * PCT;
  const restSeg = (restWidth - REST_GAP * (REST_PARTS - 1)) / REST_PARTS;

  // The mark America landed on last time, left behind the moment it passes.
  const ghost = clamp01((usSolid - (start.us + cap0) - 2) / 6);
  // Ruler marks, staggered left to right: seven of China's ceiling fit inside
  // America, and counting them is the whole comparison.
  const rulerAt = (p: number) => {
    const i = p / cnCeiling - 1;
    return ramp(beats.dataCenter + i * 6, beats.dataCenter + i * 6 + 12);
  };

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
          <clipPath id="shift-us">
            <rect x={0} y={0} width={Math.max(0, usSolid * PCT)} height={BAR_H} rx={RADIUS} />
          </clipPath>
          <clipPath id="shift-cn">
            <rect x={0} y={0} width={cnW * PCT} height={BAR_H} rx={RADIUS} />
          </clipPath>
          <clipPath id="shift-rest">
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

          {/* America. The field is authored to its final length once, so the
              canton never moves while the share grows over it. */}
          <g transform={`translate(${X0}, ${BAR_TOP})`}>
            <g clipPath="url(#shift-us)">
              <UsField w={usToday * PCT} h={BAR_H} />
            </g>
          </g>

          {/* The grey China is pushed into, and then drawn back out of. */}
          {cnW > 0.01 ? (
            <g transform={`translate(${px(cnLeft)}, ${BAR_TOP})`}>
              <rect
                x={0}
                y={0}
                width={cnW * PCT}
                height={BAR_H}
                rx={RADIUS}
                fill={ink}
                opacity={restInk * absorb * (1 - reemerge)}
              />
              <g clipPath="url(#shift-cn)" opacity={cnInk}>
                <CnField w={(start.rest - start.us - cap0) * PCT} h={BAR_H} />
              </g>
            </g>
          ) : null}

          {restWidth > 0.5 ? (
            <g transform={`translate(${px(restLeft)}, ${BAR_TOP})`} clipPath="url(#shift-rest)">
              <rect
                x={0}
                y={0}
                width={restWidth * PCT}
                height={BAR_H}
                rx={RADIUS}
                fill={ink}
                opacity={restInk}
              />
            </g>
          ) : null}

          {/* He names China long before he sizes it. The grey it was pushed
              into warms first, over exactly the room it turns out to have. */}
          {held > 0.004 ? (
            <g transform={`translate(${px(restLeft)}, ${BAR_TOP})`} clipPath="url(#shift-rest)">
              <rect
                x={(usSolid - restLeft) * PCT}
                y={0}
                width={cnToday * PCT}
                height={BAR_H}
                rx={RADIUS}
                fill="#DE2910"
                opacity={0.22 * held}
              />
            </g>
          ) : null}

          {/* Room a claim has been left, never ground it has taken. */}
          {usCapW > 0.02 ? (
            <rect
              x={px(usSolid)}
              y={BAR_TOP + REACH_INSET}
              width={usCapW * PCT}
              height={BAR_H - REACH_INSET * 2}
              rx={REACH_RADIUS}
              fill="none"
              stroke={ink}
              strokeWidth={REACH_W}
              opacity={reachOpacity}
            />
          ) : null}
          {cnCapW > 0.02 ? (
            <rect
              x={px(cnLeft + cnW)}
              y={BAR_TOP + REACH_INSET}
              width={cnCapW * PCT}
              height={BAR_H - REACH_INSET * 2}
              rx={REACH_RADIUS}
              fill="none"
              stroke={ink}
              strokeWidth={REACH_W}
              opacity={reachOpacity}
            />
          ) : null}

          {/* The measure. Two live marks ride the two boundaries; everything
              else is a fixed reading of the same scale. */}
          <line
            x1={X0}
            y1={SCALE_Y}
            x2={X0 + TRACK_W}
            y2={SCALE_Y}
            stroke={ink}
            strokeWidth={SCALE_W}
            opacity={scaleInk}
          />
          {[10, 20, 30, 40, 60, 80, 90].map((p) => tick(`r${p}`, px(p), scaleInk * 0.62 * rulerAt(p), RULE_TICK_UP, RULE_TICK_DOWN, RULE_TICK_W))}
          {tick('ghost', px(start.us + cap0), Math.max(scaleInk * 0.38 * ghost, scaleInk * 0.62 * rulerAt(start.us + cap0)), RULE_TICK_UP, RULE_TICK_DOWN, RULE_TICK_W)}
          {tick('us', px(usSolid + usCapW), 0.76)}
          {tick('rest', px(restLeft), scaleInk)}
          {tick('cap0', X0, scaleInk)}
          {tick('cap1', X0 + TRACK_W, scaleInk)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ComputeShiftToday;
