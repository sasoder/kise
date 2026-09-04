import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:17.199 -> 00:00:28.660 of Dylan_Two_Labs2. round(11.461 * 30) = 344.
export const DURATION = 344;

// The column is pushed to the right so the annotation has a lane of its own.
// The previous two scenes are symmetrical; this one is not, which keeps a long
// stretch of overlay from reading as a repeat of them.
const COL_X = 560;
const COL_W = 400;
const HALF_X = COL_X + COL_W / 2;

const BASE_Y = 1400;
const CEIL_Y = 380;
const HEADROOM = BASE_Y - CEIL_Y;
// Space between the stock and what gets added to it: two quantities, stacked,
// not one bar with a line drawn on it.
const BAND_GAP = 20;
// Compute grows into the frame at full size first and only then does the view
// give way, so the early growth reads as growth rather than as a zoom.
const UNIT_MAX = 400;
const RADIUS = 10;

const RULE_W = 5;
const RULE_OVERHANG = 46;
const TICK_H = 15;

const LEAD_X0 = 486;
const LEAD_X1 = 544;
const LABEL_RIGHT = 470;
const LABEL_LEFT = 90;
const LABEL_SIZE = 46;
const LINE_H = 56;

const LEGEND_Y = 1452;
const LEGEND_SIZE = 42;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const snap = (v: number) => Math.round(v) + 0.5;

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
  // The stock of compute that already exists, in the units the bar is drawn in.
  stock: z.number(),
  // What gets added, as multiples of that stock: a first estimate, then the
  // two upward revisions he talks himself into.
  added: z.object({
    first: z.number(),
    growing: z.number(),
    most: z.number(),
  }),
  labels: z.object({
    stock: z.string(),
    addedTop: z.string(),
    addedBottom: z.string(),
    legendTop: z.string(),
    legendBottom: z.string(),
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
    legend: z.number().int(),
    grow: z.number().int(),
    growEnd: z.number().int(),
    surge: z.number().int(),
    surgeEnd: z.number().int(),
  }),
});

export type TwoLabsIncrementalHalfProps = z.infer<typeof schema>;

export const defaultProps: TwoLabsIncrementalHalfProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  stockOpacity: 0.16,
  addedOpacity: 0.34,
  claimOpacity: 0.92,
  stock: 1,
  added: {first: 0.45, growing: 0.8, most: 2.35},
  labels: {
    stock: 'TODAY',
    addedTop: 'NEW',
    addedBottom: 'NEXT YEAR',
    legendTop: 'OPENAI +',
    legendBottom: 'ANTHROPIC',
  },
  beats: {
    stock: 0,
    added: 65,
    half: 98,
    halfEnd: 167,
    legend: 157,
    grow: 189,
    growEnd: 245,
    surge: 258,
    surgeEnd: 326,
  },
});

const TwoLabsIncrementalHalf: React.FC<TwoLabsIncrementalHalfProps> = ({
  ink,
  accent,
  shadow,
  stockOpacity,
  addedOpacity,
  claimOpacity,
  stock,
  added,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ease = (a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});

  const step = (a: number, b: number, delta: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(frame, [a, b], [0, delta], {easing, ...clamp});

  // One scalar for how much gets added, built as three revisions so each
  // phrase owns its own easing and its own visible push.
  const inc =
    step(beats.added, beats.half, added.first) +
    step(beats.grow, beats.growEnd, added.growing - added.first, Easing.inOut(Easing.cubic)) +
    step(beats.surge, beats.surgeEnd, added.most - added.growing, Easing.inOut(Easing.cubic));

  const stockIn = ease(beats.stock - 14, beats.stock + 20);

  // The bar grows at a fixed scale until it reaches the ceiling; past that the
  // view yields instead. Anchored to the floor either way.
  const unit = Math.min(UNIT_MAX, (HEADROOM - BAND_GAP) / (stock + inc));

  const stockH = stock * unit * stockIn;
  const stockTop = BASE_Y - stockH;
  const addedBottom = BASE_Y - stock * unit - BAND_GAP;
  const addedH = inc * unit;
  const addedTop = addedBottom - addedH;

  // Half of what gets added. The mark is set first and the fill runs up to
  // meet it, so "half" is a place the block arrives at, not a proportion the
  // viewer is asked to measure.
  const splitIn = ease(beats.half, beats.half + 22);
  const claimed = step(beats.half, beats.halfEnd, 0.5);
  const claimW = COL_W * claimed;
  // One brightening as the fill lands flush against the mark.
  const meet = interpolate(
    frame,
    [beats.halfEnd - 8, beats.halfEnd + 4, beats.halfEnd + 24],
    [0, 1, 0],
    {easing: Easing.out(Easing.cubic), ...clamp},
  );

  const addedIn = ease(beats.added, beats.added + 16);
  const legendIn = ease(beats.legend, beats.legend + 16);
  const floorIn = ease(beats.stock - 10, beats.stock + 14);

  const labelBlocks = [
    {key: 'stock', lines: [labels.stock], cy: (stockTop + BASE_Y) / 2, on: ease(beats.stock + 14, beats.stock + 34)},
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
          {/* The floor everything stands on. */}
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

          {/* Compute that already exists. */}
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

          {/* What gets added on top of it. */}
          {addedH > 1 ? (
            <g opacity={addedIn}>
              <defs>
                <clipPath id="addedBand">
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

              {/* Half of it. Clipped to the band so the division is a clean
                  vertical cut and not a rounded tile laid on top of one. */}
              {claimW > 1 ? (
                <g clipPath="url(#addedBand)">
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

          {/* Leaders out to the annotation lane. */}
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

        {/* What the accent has meant since the first scene, said once. */}
        <div
          style={{
            position: 'absolute',
            left: LABEL_LEFT,
            top: LEGEND_Y,
            width: LABEL_RIGHT - LABEL_LEFT,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 10,
            opacity: legendIn * 0.95,
            transform: `translateY(${(1 - legendIn) * 12}px)`,
          }}
        >
          <span style={typeStyle(LEGEND_SIZE, accent)}>{labels.legendTop}</span>
          <span style={typeStyle(LEGEND_SIZE, accent)}>{labels.legendBottom}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default TwoLabsIncrementalHalf;
