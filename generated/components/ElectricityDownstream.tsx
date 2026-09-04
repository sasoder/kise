import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  background: z.string().default('#faf9f5'),
  accent: z.string().default('#d97757'),
  neutral: z.string().default('#b0aea5'),
  surface: z.string().default('#e8e6dc'),
  olive: z.string().default('#788c5d'),
  pushIn: z.number().min(1).max(1.2).default(1.03),
  hairOpacity: z.number().min(0).max(1).default(0.55),
});

export type ElectricityDownstreamProps = z.infer<typeof schema>;

export const defaultProps: ElectricityDownstreamProps = schema.parse({});

// Beats keyed to the VO, 30fps, t=0 at "normally" (00:00:55.600)
const F_SOURCE_IN = 4; // "normally"
const F_LINE_START = 34; // "provide"
const F_LINE_END = 58;
const F_FIELD_IN = 55; // "to people"
const F_BOUNDARY_IN = 52;
const F_SPLIT = 69; // "you don't have like"
const F_RETICLE_IN = 96; // "granular"
const F_PUSH = 125; // "the way that"
const F_ALL_ON = 162; // "world"
const END = 200;

// Source: the part you own
const SRC_X = 380;
const SRC_Y = 240;
const SRC_W = 320;
const SRC_H = 230;
const BAR_W = 240;
const BAR_H = 20;
const BAR_GAP = 16;
const BAR_COUNT = 5;
const BAR_Y0 = SRC_Y + (SRC_H - (BAR_COUNT * BAR_H + (BAR_COUNT - 1) * BAR_GAP)) / 2;

// The edge of control. Everything between here and the field is the fan-out.
const SPLIT_X = 540;
const SPLIT_Y = 900;

// The field: everyone downstream
const COLS = 8;
const ROWS = 6;
const CELL_W = 70;
const CELL_H = 52;
const COL_PITCH = 112;
const ROW_PITCH = 98;
const FIELD_X0 = 113;
const FIELD_Y0 = 1120;

const cellX = (c: number) => FIELD_X0 + c * COL_PITCH;
const cellY = (r: number) => FIELD_Y0 + r * ROW_PITCH;
const cellCX = (c: number) => cellX(c) + CELL_W / 2;

// Stable per-element scatter: organic, never flickers frame to frame
const fract = (n: number) => n - Math.floor(n);
const hash = (i: number, k: number) => fract(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

type Hair = {d: string; delay: number; dur: number; opacity: number};

const buildHairs = (): Hair[] => {
  // Roughly half the field gets a traceable feed; the rest just gets power
  const targets: Array<{c: number; r: number}> = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (hash(r * COLS + c, 5) > 0.6) targets.push({c, r});
    }
  }

  // Outer runs break off the bus first, so the routing reads as a diagram
  targets.sort((a, b) => Math.abs(cellCX(b.c) - SPLIT_X) - Math.abs(cellCX(a.c) - SPLIT_X));

  const hairs: Hair[] = targets.map(({c, r}, i) => {
    // Each run leaves the trunk at its own depth so the fan stays countable-looking
    const busY = SPLIT_Y + 30 + (i / Math.max(1, targets.length - 1)) * 158;
    const cx = cellCX(c);
    const ty = cellY(r);
    const d =
      r === 0
        ? `M ${SPLIT_X} ${SPLIT_Y} V ${busY} H ${cx} V ${ty}`
        : // thread down a column gap, then step across into the row
          `M ${SPLIT_X} ${SPLIT_Y} V ${busY} H ${204 + (c >= 4 ? c - 1 : c) * COL_PITCH} V ${
            ty - 23
          } H ${cx} V ${ty}`;
    return {d, delay: F_SPLIT + i * 0.8, dur: 24, opacity: 1};
  });

  // The ones that just leave the page
  const away: string[] = [
    `M ${SPLIT_X} ${SPLIT_Y} V 942 H 1140`,
    `M ${SPLIT_X} ${SPLIT_Y} V 1004 H 1140`,
    `M ${SPLIT_X} ${SPLIT_Y} V 1066 H 1140`,
    `M ${SPLIT_X} ${SPLIT_Y} V 972 H -60`,
    `M ${SPLIT_X} ${SPLIT_Y} V 1034 H -60`,
    `M ${SPLIT_X} ${SPLIT_Y} V 1092 H -60`,
    `M ${SPLIT_X} ${SPLIT_Y} V 926 H 1020 V -60`,
    `M ${SPLIT_X} ${SPLIT_Y} V 1050 H 60 V -60`,
    `M ${SPLIT_X} ${SPLIT_Y} V 988 H 1050 V 2000`,
    `M ${SPLIT_X} ${SPLIT_Y} V 1108 H 30 V 2000`,
  ];

  away.forEach((d, i) => {
    hairs.push({d, delay: F_SPLIT + 6 + i * 2, dur: 60, opacity: 0.8});
  });

  return hairs;
};

const HAIRS = buildHairs();

// A handful of houses light on their own, in no order anyone chose
const STRAYS = Array.from({length: COLS * ROWS}, (_, k) => k)
  .filter((k) => hash(k, 7) > 0.74)
  .map((k) => {
    const start = 104 + hash(k, 8) * 46;
    return {k, start, end: start + 7 + hash(k, 9) * 16};
  });

const RETICLE_KEYS = [96, 106, 114, 118, 126, 130, 144];
const RETICLE_X = [372, 372, 708, 708, 484, 484, 1320];
const RETICLE_Y = [1244, 1244, 1342, 1342, 1538, 1538, 1538];

const ElectricityDownstream: React.FC<ElectricityDownstreamProps> = ({
  background,
  accent,
  neutral,
  surface,
  olive,
  pushIn,
  hairOpacity,
}) => {
  const frame = useCurrentFrame();

  // The only camera move in the piece
  const push = interpolate(frame, [F_PUSH, END - 10], [1, pushIn], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lineDraw = interpolate(frame, [F_LINE_START, F_LINE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const boundaryIn = interpolate(frame, [F_BOUNDARY_IN, F_BOUNDARY_IN + 16], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Once the field is lit, the wiring stops being the subject
  const hairDim = interpolate(frame, [F_ALL_ON, F_ALL_ON + 12], [1, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const allOn = interpolate(frame, [F_ALL_ON, F_ALL_ON + 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const reticleOpacity = interpolate(frame, [F_RETICLE_IN, 102, 134, 146], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const reticleDrop = interpolate(frame, [F_RETICLE_IN, F_RETICLE_IN + 8], [-70, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const reticleX = interpolate(frame, RETICLE_KEYS, RETICLE_X, {
    easing: Easing.bezier(0.5, 0, 0.2, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const reticleY = interpolate(frame, RETICLE_KEYS, RETICLE_Y, {
    easing: Easing.bezier(0.5, 0, 0.2, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // It keeps hunting; it never settles on one
  const reticleScale = 1 + 0.06 * Math.sin(frame * 0.55);

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        xmlns="http://www.w3.org/2000/svg"
        style={{position: 'absolute', inset: 0}}
      >
        <g transform={`translate(540 1200) scale(${push}) translate(-540 -1200)`}>
          {/* The source you control */}
          <rect
            x={SRC_X}
            y={SRC_Y}
            width={SRC_W}
            height={SRC_H}
            rx={16}
            fill="none"
            stroke={neutral}
            strokeWidth={2}
          />
          {Array.from({length: BAR_COUNT}, (_, i) => {
            const t = interpolate(frame, [F_SOURCE_IN + i * 3, F_SOURCE_IN + i * 3 + 16], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <rect
                key={i}
                x={SRC_X + (SRC_W - BAR_W) / 2}
                y={BAR_Y0 + i * (BAR_H + BAR_GAP) + (1 - t) * 14}
                width={BAR_W}
                height={BAR_H}
                rx={4}
                fill={accent}
                opacity={t}
              />
            );
          })}

          {/* One line out, entirely under control */}
          <path
            d={`M ${SPLIT_X} ${SRC_Y + SRC_H} V ${SPLIT_Y}`}
            fill="none"
            stroke={accent}
            strokeWidth={6}
            strokeLinecap="butt"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - lineDraw}
          />

          {/* The edge of control */}
          <path
            d={`M 96 ${SPLIT_Y} H 984`}
            fill="none"
            stroke={neutral}
            strokeWidth={1.5}
            strokeDasharray="7 9"
            opacity={boundaryIn * 0.9}
          />

          {/* Past it, one line becomes more than anyone can track */}
          {HAIRS.map((hair, i) => {
            const p = interpolate(frame, [hair.delay, hair.delay + hair.dur], [0, 1], {
              easing: Easing.bezier(0.3, 0, 0.5, 1),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            if (p <= 0) return null;
            return (
              <path
                key={i}
                d={hair.d}
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="butt"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={hairOpacity * hair.opacity * hairDim}
              />
            );
          })}

          <circle
            cx={SPLIT_X}
            cy={SPLIT_Y}
            r={7}
            fill={accent}
            opacity={interpolate(frame, [F_SPLIT, F_SPLIT + 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
          />

          {/* Everyone downstream */}
          {Array.from({length: COLS * ROWS}, (_, k) => {
            const c = k % COLS;
            const r = Math.floor(k / COLS);
            const inT = interpolate(
              frame,
              [F_FIELD_IN + k * 0.45, F_FIELD_IN + k * 0.45 + 12],
              [0, 1],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              },
            );
            const stray = STRAYS.find((s) => s.k === k);
            const strayT = stray
              ? interpolate(
                  frame,
                  [stray.start, stray.start + 4, stray.end, stray.end + 5],
                  [0, 1, 1, 0],
                  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
                )
              : 0;
            const lit = Math.max(strayT * 0.42, allOn);
            return (
              <g key={k} opacity={inT}>
                <rect
                  x={cellX(c)}
                  y={cellY(r) + (1 - inT) * 8}
                  width={CELL_W}
                  height={CELL_H}
                  rx={8}
                  fill={surface}
                />
                <rect
                  x={cellX(c)}
                  y={cellY(r) + (1 - inT) * 8}
                  width={CELL_W}
                  height={CELL_H}
                  rx={8}
                  fill={accent}
                  opacity={lit}
                />
              </g>
            );
          })}

          {/* Trying to isolate one of them */}
          <g
            opacity={reticleOpacity}
            transform={`translate(${reticleX} ${reticleY + reticleDrop}) scale(${reticleScale})`}
          >
            <circle r={44} fill="none" stroke={olive} strokeWidth={3} />
            {[0, 1, 2, 3].map((t) => {
              const a = (t * Math.PI) / 2;
              const flick = hash(Math.floor(frame / 3) + t, 11) > 0.35 ? 1 : 0.25;
              return (
                <line
                  key={t}
                  x1={Math.cos(a) * 54}
                  y1={Math.sin(a) * 54}
                  x2={Math.cos(a) * 76}
                  y2={Math.sin(a) * 76}
                  stroke={olive}
                  strokeWidth={3}
                  opacity={flick}
                />
              );
            })}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ElectricityDownstream;
