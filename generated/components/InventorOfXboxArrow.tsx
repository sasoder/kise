// Two gestures, nothing else:
// 1. Label slides up — the credit "Inventor of Xbox" arrives.
// 2. Arrow draws from above the label toward the right — points at him.

import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
  weights: ['800'],
  subsets: ['latin'],
});

export const FPS = 24;
export const DURATION = 96;

export const schema = z.object({
  label: z.string(),
  fontSize: z.number().min(24).max(240),
  x: z.number().min(0).max(1080),
  y: z.number().min(0).max(1920),
  strokeWidth: z.number().min(2).max(48),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
});

export type InventorOfXboxArrowProps = z.infer<typeof schema>;

export const defaultProps: InventorOfXboxArrowProps = schema.parse({
  label: 'Inventor of Xbox',
  fontSize: 88,
  x: 540,
  y: 1300,
  strokeWidth: 14,
  shadowOffset: 4,
  rise: 130,
  staggerFrames: 2,
});

// CORE MEMORY chain, used raw: no blend mode, no bloom, no saturation, no
// opacity animation. Orange leads, the white core lands last and covers them.
const TRAIL_COLORS = [
  '#FFB765', // orange, first to arrive
  '#BC37FF', // purple
  '#0046FF', // blue, last of the colours
];
const CORE_COLOR = '#FFFFFF';
const SHADOW_COLOR = '#000000';

const TRAVEL_FRAMES = 22;
// The white text lands at frame 28; the arrow starts pointing right after.
const ARROW_START = 30;

const WIDTH = 1080;
const HEIGHT = 1920;

// Barlow 800 average advance — the arrow only needs the label's rough extent.
const ADVANCE = 0.56;
const HEAD_LEN = 40;
const HEAD_ANGLE = 38;

const quadAt = (
  t: number,
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
): [number, number] => {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
};

// getTotalLength() is a DOM measurement, so the curve is sampled here instead.
const quadLength = (
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
) => {
  const steps = 64;
  let len = 0;
  let prev = quadAt(0, p0, p1, p2);
  for (let i = 1; i <= steps; i++) {
    const next = quadAt(i / steps, p0, p1, p2);
    len += Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    prev = next;
  }
  return len;
};

const InventorOfXboxArrow: React.FC<InventorOfXboxArrowProps> = ({
  label,
  fontSize,
  x,
  y,
  strokeWidth,
  shadowOffset,
  rise,
  staggerFrames,
}) => {
  const frame = useCurrentFrame();

  // One easing for the whole file: quick off the mark, long ease into place.
  const progressAt = (delay: number) =>
    interpolate(frame, [delay, delay + TRAVEL_FRAMES], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  // Nothing fades, so a layer simply does not exist until its turn.
  const hasStarted = (delay: number) => frame >= delay;

  const offsetAt = (delay: number) => (1 - progressAt(delay)) * rise;

  const coreDelay = TRAIL_COLORS.length * staggerFrames;
  const coreOffset = offsetAt(coreDelay);

  // Text box: centre (x, y), height about one em.
  const w = label.length * fontSize * ADVANCE;
  const yt = y - fontSize * 0.5;

  const tail: [number, number] = [x - w * 0.12, yt - 34];
  const ctrl: [number, number] = [x + w * 0.14, yt - 230];
  const tip: [number, number] = [x + w * 0.48, yt - 96];

  // Tangent at the tip of a quadratic points along H - C.
  const dx = tip[0] - ctrl[0];
  const dy = tip[1] - ctrl[1];
  const dl = Math.hypot(dx, dy);
  const ux = dx / dl;
  const uy = dy / dl;

  // Open chevron: two legs off the tip, swept back from the tangent.
  const leg = (deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    const bx = -ux;
    const by = -uy;
    return [
      tip[0] + (bx * Math.cos(a) - by * Math.sin(a)) * HEAD_LEN,
      tip[1] + (bx * Math.sin(a) + by * Math.cos(a)) * HEAD_LEN,
    ];
  };
  const legA = leg(HEAD_ANGLE);
  const legB = leg(-HEAD_ANGLE);

  const n = (v: number) => v.toFixed(2);
  // Skia restarts the dash phase on every subpath, so an `M`-separated chevron
  // would snap on whole instead of drawing. One contour instead: out to side A,
  // back over it to the tip, out to side B. The retrace is invisible, and one
  // dashoffset now draws curve, then side A, then side B, in order.
  const d =
    `M ${n(tail[0])} ${n(tail[1])} Q ${n(ctrl[0])} ${n(ctrl[1])} ${n(tip[0])} ${n(tip[1])} ` +
    `L ${n(legA[0])} ${n(legA[1])} L ${n(tip[0])} ${n(tip[1])} ` +
    `L ${n(legB[0])} ${n(legB[1])}`;

  const pathLength = quadLength(tail, ctrl, tip) + HEAD_LEN * 3;

  const textLayerStyle = (
    color: string,
    offset: number,
    nudge: number,
    zIndex: number,
  ): React.CSSProperties => ({
    position: 'absolute',
    left: x,
    top: y,
    zIndex,
    transform: `translate(-50%, -50%) translate(${nudge}px, ${offset + nudge}px)`,
    fontFamily,
    fontWeight: 800,
    fontSize,
    lineHeight: 1,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
    color,
  });

  const strokeProps = {
    d,
    fill: 'none',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: pathLength,
  };

  return (
    <AbsoluteFill>
      {/* Hard readability shadow, at the very back so it never darkens the
          colours. Zero blur, rides with the core. */}
      {hasStarted(coreDelay) ? (
        <div style={textLayerStyle(SHADOW_COLOR, coreOffset, shadowOffset, 0)}>
          {label}
        </div>
      ) : null}

      {TRAIL_COLORS.map((color, i) =>
        hasStarted(i * staggerFrames) ? (
          <div
            key={color}
            style={textLayerStyle(color, offsetAt(i * staggerFrames), 0, i + 1)}
          >
            {label}
          </div>
        ) : null,
      )}

      {hasStarted(coreDelay) ? (
        <div
          style={textLayerStyle(
            CORE_COLOR,
            coreOffset,
            0,
            TRAIL_COLORS.length + 1,
          )}
        >
          {label}
        </div>
      ) : null}

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{position: 'absolute', left: 0, top: 0}}
      >
        {/* Same stack along the draw: shadow, orange, purple, blue, white. */}
        {hasStarted(ARROW_START + coreDelay) ? (
          <path
            {...strokeProps}
            stroke={SHADOW_COLOR}
            transform={`translate(${shadowOffset} ${shadowOffset})`}
            strokeDashoffset={
              pathLength * (1 - progressAt(ARROW_START + coreDelay))
            }
          />
        ) : null}

        {TRAIL_COLORS.map((color, i) =>
          hasStarted(ARROW_START + i * staggerFrames) ? (
            <path
              key={color}
              {...strokeProps}
              stroke={color}
              strokeDashoffset={
                pathLength * (1 - progressAt(ARROW_START + i * staggerFrames))
              }
            />
          ) : null,
        )}

        {hasStarted(ARROW_START + coreDelay) ? (
          <path
            {...strokeProps}
            stroke={CORE_COLOR}
            strokeDashoffset={
              pathLength * (1 - progressAt(ARROW_START + coreDelay))
            }
          />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export default InventorOfXboxArrow;
