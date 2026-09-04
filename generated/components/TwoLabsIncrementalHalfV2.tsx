import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:17.199 -> 00:00:28.660 of Dylan_Two_Labs2. round(11.461 * 30) = 344.
export const DURATION = 344;

const COL_X = 560;
const COL_W = 400;
const HALF_X = COL_X + COL_W / 2;

const BASE_Y = 1400;
const CEIL_Y = 380;
const HEADROOM = BASE_Y - CEIL_Y;
const BAND_GAP = 20;
const UNIT_MAX = 400;
// How gently the view gives way once the bar reaches the ceiling. A hard
// min() puts a corner in the growth: the bar climbs at one rate and then
// everything starts shrinking on a single frame.
const YIELD_SOFTNESS = 60;
const RADIUS = 10;

const RULE_W = 5;
const RULE_OVERHANG = 46;
const TICK_H = 15;

const LEAD_X0 = 486;
const LEAD_X1 = 544;
const LABEL_RIGHT = 470;
const LABEL_LEFT = 90;
const LABEL_SIZE = 58;
const LINE_H = 70;

const KEY_Y = 1452;
const KEY_SIZE = 44;
const KEY_SWATCH_W = 22;
const KEY_SWATCH_H = 68;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const snap = (v: number) => Math.round(v) + 0.5;

// Polynomial smooth minimum: rounds the corner where the bar stops growing
// into the frame and the frame starts giving way instead.
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
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
  accent: z.string(),
  shadow: z.string(),
  stockOpacity: z.number().min(0).max(1),
  addedOpacity: z.number().min(0).max(1),
  claimOpacity: z.number().min(0).max(1),
  stock: z.number(),
  added: z.object({
    first: z.number(),
    growing: z.number(),
    most: z.number(),
  }),
  // How far past the half mark the fill presses before it settles back onto
  // it, as a fraction of the band width.
  overshoot: z.number().min(0).max(0.1),
  labels: z.object({
    stock: z.string(),
    addedTop: z.string(),
    addedBottom: z.string(),
    keyTop: z.string(),
    keyBottom: z.string(),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:17.199:
  //     0 "i mean it's"      ·  19 "really by"      ·  50 "the end of"
  //    65 "next year it's"   ·  98 "already half of" · 118 "the incremental"
  //   148 "going to"         · 157 "anthropic"      · 167 "and openai"
  //   189 "because"          · 201 "compute is"     · 240 "growing so fast"
  //   269 "incremental"      · 278 "compute is"     · 295 "going to be"
  //   303 "basically"        · 313 "most of compute"
  beats: z.object({
    stock: z.number().int(),
    added: z.number().int(),
    half: z.number().int(),
    halfEnd: z.number().int(),
    key: z.number().int(),
    grow: z.number().int(),
    growEnd: z.number().int(),
    surge: z.number().int(),
    surgeEnd: z.number().int(),
  }),
});

export type TwoLabsIncrementalHalfV2Props = z.infer<typeof schema>;

export const defaultProps: TwoLabsIncrementalHalfV2Props = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  stockOpacity: 0.16,
  addedOpacity: 0.34,
  claimOpacity: 0.92,
  stock: 1,
  added: {first: 0.45, growing: 0.8, most: 2.35},
  overshoot: 0.016,
  labels: {
    stock: 'TODAY',
    addedTop: 'NEW',
    addedBottom: 'NEXT YEAR',
    keyTop: 'OPENAI +',
    keyBottom: 'ANTHROPIC',
  },
  beats: {
    stock: 0,
    added: 65,
    half: 98,
    halfEnd: 167,
    key: 157,
    grow: 189,
    growEnd: 245,
    surge: 258,
    surgeEnd: 326,
  },
});

const TwoLabsIncrementalHalfV2: React.FC<TwoLabsIncrementalHalfV2Props> = ({
  ink,
  accent,
  shadow,
  stockOpacity,
  addedOpacity,
  claimOpacity,
  stock,
  added,
  overshoot,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ease = (a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});

  const step = (a: number, b: number, delta: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(frame, [a, b], [0, delta], {easing, ...clamp});

  const inc =
    step(beats.added, beats.half, added.first) +
    step(beats.grow, beats.growEnd, added.growing - added.first, Easing.inOut(Easing.cubic)) +
    step(beats.surge, beats.surgeEnd, added.most - added.growing, Easing.inOut(Easing.cubic));

  const stockIn = ease(beats.stock - 14, beats.stock + 20);

  const unit = smin(UNIT_MAX, (HEADROOM - BAND_GAP) / (stock + inc), YIELD_SOFTNESS);

  const stockH = stock * unit * stockIn;
  const stockTop = BASE_Y - stockH;
  const addedBottom = BASE_Y - stock * unit - BAND_GAP;
  const addedH = inc * unit;
  const addedTop = addedBottom - addedH;

  const splitIn = ease(beats.half, beats.half + 22);
  // Presses a little past the mark and settles back onto it. Without this the
  // fill just stops, and a quantity that stops dead does not feel like it
  // arrived anywhere.
  const claimed =
    step(beats.half, beats.halfEnd, 0.5 + overshoot) -
    step(beats.halfEnd, beats.halfEnd + 18, overshoot);
  const claimW = COL_W * claimed;
  const meet = interpolate(
    frame,
    [beats.halfEnd - 8, beats.halfEnd + 4, beats.halfEnd + 24],
    [0, 1, 0],
    {easing: Easing.out(Easing.cubic), ...clamp},
  );

  const addedIn = ease(beats.added, beats.added + 16);
  const keyIn = ease(beats.key, beats.key + 16);
  const floorIn = ease(beats.stock - 10, beats.stock + 14);

  const labelBlocks = [
    {
      key: 'stock',
      lines: [labels.stock],
      cy: (stockTop + BASE_Y) / 2,
      on: ease(beats.stock + 14, beats.stock + 34),
    },
    {
      key: 'added',
      lines: [labels.addedTop, labels.addedBottom],
      cy: (addedTop + addedBottom) / 2,
      on: ease(beats.added + 8, beats.added + 28),
    },
  ];

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          <g opacity={floorIn}>
            <line
              x1={COL_X - RULE_OVERHANG}
              y1={snap(BASE_Y)}
              x2={COL_X + COL_W + RULE_OVERHANG}
              y2={snap(BASE_Y)}
              stroke={ink}
              strokeWidth={RULE_W}
              strokeLinecap="round"
              opacity={0.8}
            />
            {[COL_X - RULE_OVERHANG, COL_X + COL_W + RULE_OVERHANG].map((x) => (
              <line
                key={`t${x}`}
                x1={snap(x)}
                y1={BASE_Y - TICK_H}
                x2={snap(x)}
                y2={BASE_Y + TICK_H}
                stroke={ink}
                strokeWidth={RULE_W}
                strokeLinecap="round"
                opacity={0.8}
              />
            ))}
          </g>

          {stockH > 1 ? (
            <rect
              x={COL_X}
              y={stockTop}
              width={COL_W}
              height={stockH}
              rx={Math.min(RADIUS, stockH / 2)}
              fill={ink}
              opacity={stockOpacity}
            />
          ) : null}

          {addedH > 1 ? (
            <g opacity={addedIn}>
              <defs>
                <clipPath id="addedBandV2">
                  <rect
                    x={COL_X}
                    y={addedTop}
                    width={COL_W}
                    height={addedH}
                    rx={Math.min(RADIUS, addedH / 2)}
                  />
                </clipPath>
              </defs>
              <rect
                x={COL_X}
                y={addedTop}
                width={COL_W}
                height={addedH}
                rx={Math.min(RADIUS, addedH / 2)}
                fill={ink}
                opacity={addedOpacity}
              />

              {claimW > 1 ? (
                <g clipPath="url(#addedBandV2)">
                  <rect
                    x={COL_X}
                    y={addedTop}
                    width={claimW}
                    height={addedH}
                    fill={accent}
                    opacity={claimOpacity}
                  />
                </g>
              ) : null}

              <line
                x1={snap(HALF_X)}
                y1={addedTop}
                x2={snap(HALF_X)}
                y2={addedBottom}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={(0.5 + 0.4 * meet) * splitIn}
              />
            </g>
          ) : null}

          {labelBlocks.map((b) => (
            <line
              key={`ld${b.key}`}
              x1={LEAD_X0}
              y1={snap(b.cy)}
              x2={LEAD_X0 + (LEAD_X1 - LEAD_X0) * b.on}
              y2={snap(b.cy)}
              stroke={ink}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.45 * b.on}
            />
          ))}
        </g>
      </svg>

      <AbsoluteFill style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        {labelBlocks.map((b) => (
          <div
            key={`lb${b.key}`}
            style={{
              position: 'absolute',
              left: LABEL_LEFT,
              top: b.cy - (b.lines.length * LINE_H) / 2,
              width: LABEL_RIGHT - LABEL_LEFT,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: LINE_H - LABEL_SIZE,
              opacity: b.on * 0.92,
              transform: `translateX(${(1 - b.on) * -16}px)`,
            }}
          >
            {b.lines.map((line) => (
              <span key={line} style={typeStyle(LABEL_SIZE, ink)}>
                {line}
              </span>
            ))}
          </div>
        ))}

        {/* The key is a copy of the on-chart fill, not a coloured word. */}
        <div
          style={{
            position: 'absolute',
            left: LABEL_LEFT,
            top: KEY_Y,
            width: LABEL_RIGHT - LABEL_LEFT,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
            opacity: keyIn * 0.92,
            transform: `translateY(${(1 - keyIn) * 12}px)`,
          }}
        >
          <div
            style={{
              width: KEY_SWATCH_W,
              height: KEY_SWATCH_H,
              borderRadius: 8,
              background: accent,
              opacity: claimOpacity,
            }}
          />
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8}}>
            <span style={typeStyle(KEY_SIZE, ink)}>{labels.keyTop}</span>
            <span style={typeStyle(KEY_SIZE, ink)}>{labels.keyBottom}</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default TwoLabsIncrementalHalfV2;
