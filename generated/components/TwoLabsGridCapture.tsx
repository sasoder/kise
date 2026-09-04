import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:00.000 -> 00:00:09.400 of the source cut.
export const DURATION = 282;

const COLS = 10;
const ROWS = 10;
const CELL = 76;
const GAP = 12;
const PITCH = CELL + GAP;
const TOTAL = COLS * ROWS;

const GRID_W = COLS * PITCH - GAP;
const GRID_H = ROWS * PITCH - GAP;
const X0 = Math.round((1080 - GRID_W) / 2);
const Y0 = 980 - Math.round(GRID_H / 2);

const RADIUS = 10;
const RULE_OVERHANG = 46;

// The two labs. Bottom row, centre pair — the substrate reveal radiates from
// here, so the world arrives around them rather than them arriving in it.
const SEED_SLOTS = [9 * COLS + 4, 9 * COLS + 5];

// Stable per-cell scatter (see MEMORY.md): organic, never flickering.
const hash = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const slotCol = (slot: number) => slot % COLS;
const slotRow = (slot: number) => Math.floor(slot / COLS);
const slotX = (slot: number) => X0 + slotCol(slot) * PITCH;
const slotY = (slot: number) => Y0 + slotRow(slot) * PITCH;

// Where claim index p sits once the block is packed: bottom row first, then
// left to right upward. Claim index 49 therefore completes exactly five rows.
const packedSlot = (p: number) => (ROWS - 1 - Math.floor(p / COLS)) * COLS + (p % COLS);

const SEED_CX = (slotCol(SEED_SLOTS[0]) + slotCol(SEED_SLOTS[1])) / 2;
const SEED_CY = slotRow(SEED_SLOTS[0]);
const MAX_D = Math.max(
  Math.hypot(SEED_CX, SEED_CY),
  Math.hypot(COLS - 1 - SEED_CX, SEED_CY),
);

const seedDist = (slot: number) =>
  Math.hypot(slotCol(slot) - SEED_CX, slotRow(slot) - SEED_CY) / MAX_D;

// Order the grid is claimed in: biased outward from the two labs, shuffled by
// `scatter` so the takeover is patchy rather than a growing blob. The seeds
// are forced to the front so they are always claim index 0 and 1.
const buildOrder = (scatter: number) => {
  const rest: {slot: number; score: number}[] = [];
  for (let slot = 0; slot < TOTAL; slot++) {
    if (SEED_SLOTS.includes(slot)) continue;
    rest.push({slot, score: seedDist(slot) + hash(slot) * scatter});
  }
  rest.sort((a, b) => a.score - b.score);
  const orderOf = new Array<number>(TOTAL).fill(0);
  SEED_SLOTS.forEach((slot, i) => {
    orderOf[slot] = i;
  });
  rest.forEach((entry, i) => {
    orderOf[entry.slot] = i + SEED_SLOTS.length;
  });
  return orderOf;
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  claimOpacity: z.number().min(0).max(1),
  pressureOpacity: z.number().min(0).max(1),
  scatter: z.number().min(0).max(2),
  // Cells claimed at each landing, out of 100.
  counts: z.object({
    forty: z.number(),
    fifty: z.number(),
    stop: z.number(),
    end: z.number(),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:00.000:
  //   0 "anthropic" · 13 "openai" · 50 "taking as" · 68 "much as 40"
  //   98 "to 50%" · 130 "this centralization" · 185 "slowing down or"
  //   208 "stopping" · 228 "in fact it" · 261 "accelerating"
  beats: z.object({
    seedA: z.number().int(),
    seedB: z.number().int(),
    claim: z.number().int(),
    forty: z.number().int(),
    fifty: z.number().int(),
    migrate: z.number().int(),
    migEnd: z.number().int(),
    stop: z.number().int(),
    resume: z.number().int(),
  }),
});

export type TwoLabsGridCaptureProps = z.infer<typeof schema>;

export const defaultProps: TwoLabsGridCaptureProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.1,
  claimOpacity: 0.92,
  pressureOpacity: 0.22,
  scatter: 0.85,
  counts: {forty: 40, fifty: 50, stop: 53, end: 63},
  beats: {
    seedA: 0,
    seedB: 13,
    claim: 56,
    forty: 88,
    fifty: 106,
    migrate: 124,
    migEnd: 156,
    stop: 208,
    resume: 226,
  },
});

const MIG_SPREAD = 34;
const MIG_DUR = 14;
const PRESSURE_LEAD = 3.5;
const APPEAR_WINDOW = 1.2;

const TwoLabsGridCapture: React.FC<TwoLabsGridCaptureProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  claimOpacity,
  pressureOpacity,
  scatter,
  counts,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const orderOf = React.useMemo(() => buildOrder(scatter), [scatter]);

  // The one scalar everything downstream reads: how much of the world is held.
  // Built as additive segments so each phrase owns its own easing.
  const step = (a: number, b: number, delta: number, easing: (t: number) => number) =>
    interpolate(frame, [a, b], [0, delta], {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const count =
    SEED_SLOTS.length +
    // "as much as 40" — decelerates into the number.
    step(beats.claim, beats.forty, counts.forty - SEED_SLOTS.length, Easing.out(Easing.cubic)) +
    // "to 50%" — a second push, landing on exactly half the grid.
    step(beats.forty + 8, beats.fifty, counts.fifty - counts.forty, Easing.inOut(Easing.cubic)) +
    // "slowing down or stopping" — grinds toward a halt.
    step(beats.migEnd, beats.stop, counts.stop - counts.fifty, Easing.out(Easing.quad)) +
    // "it's only accelerating" — leaves at speed, still climbing on the last frame.
    step(beats.resume, DURATION, counts.end - counts.stop, Easing.in(Easing.cubic));

  // Seeds are named, not counted, so they get their own entrance on their word.
  // The first one is already part-way in at frame 0 — "Anthropic" is the very
  // first word of the cut, so the frame must not open empty.
  const seedIn = (i: number) => {
    const t = i === 0 ? beats.seedA : beats.seedB;
    return interpolate(frame, [t, t + 12], [i === 0 ? 0.34 : 0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  const migOf = (p: number) => {
    const start = beats.migrate + (p / (TOTAL - 1)) * MIG_SPREAD;
    return interpolate(frame, [start, start + MIG_DUR], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  // The waterline only means anything once the holding is contiguous.
  const ruleIn = interpolate(frame, [beats.migrate + 18, beats.migEnd + 4], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pressureGate = interpolate(frame, [beats.migEnd - 8, beats.migEnd + 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // A fixed mark at half the world, not a tracking level. The block resolves
  // flush against it on "50%", then leaves it behind — the overshoot is the
  // whole point of "it's only accelerating".
  const halfY = Math.round(Y0 + (ROWS / 2) * PITCH - GAP / 2) + 0.5;
  // One brightening as the block lands flush against it.
  const meet = interpolate(frame, [beats.migEnd - 6, beats.migEnd + 4, beats.migEnd + 22], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cells = Array.from({length: TOTAL}, (_, slot) => {
    const p = orderOf[slot];
    const isSeed = p < SEED_SLOTS.length;

    const appear = isSeed
      ? seedIn(p)
      : interpolate(count - p, [0, APPEAR_WINDOW], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

    const pressure =
      appear > 0
        ? 0
        : pressureGate *
          interpolate(count - p, [-PRESSURE_LEAD, 0], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

    const m = migOf(p);
    const from = {x: slotX(slot), y: slotY(slot)};
    const to = {x: slotX(packedSlot(p)), y: slotY(packedSlot(p))};
    const travels = from.x !== to.x || from.y !== to.y;

    return {
      slot,
      p,
      appear,
      pressure,
      x: from.x + (to.x - from.x) * m,
      y: from.y + (to.y - from.y) * m,
      // Picks up and sets down rather than sliding flat.
      lift: travels ? 1 - 0.1 * Math.sin(Math.PI * m) : 1,
    };
  });

  // Substrate arrives as a wavefront out of the two labs.
  const substrateIn = (slot: number) => {
    const t = seedDist(slot) * 17;
    return interpolate(frame, [t, t + 10], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
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
          {/* The world's compute. */}
          {cells.map((c) => (
            <Cell
              key={`s${c.slot}`}
              x={slotX(c.slot)}
              y={slotY(c.slot)}
              fill={ink}
              opacity={dimOpacity * substrateIn(c.slot)}
            />
          ))}

          {/* What the front is about to take. */}
          {cells
            .filter((c) => c.pressure > 0.002)
            .map((c) => (
              <Cell
                key={`p${c.slot}`}
                x={c.x}
                y={c.y}
                fill={ink}
                opacity={pressureOpacity * c.pressure}
              />
            ))}

          <g opacity={ruleIn}>
            <line
              x1={X0 - RULE_OVERHANG}
              y1={halfY}
              x2={X0 + GRID_W + RULE_OVERHANG}
              y2={halfY}
              stroke={ink}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.55 + 0.35 * meet}
            />
            {[X0 - RULE_OVERHANG, X0 + GRID_W + RULE_OVERHANG].map((x) => (
              <line
                key={`t${x}`}
                x1={x}
                y1={halfY - 15}
                x2={x}
                y2={halfY + 15}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.55 + 0.35 * meet}
              />
            ))}
          </g>

          {/* Held by the two labs. */}
          {cells
            .filter((c) => c.appear > 0.002)
            .map((c) => (
              <Cell
                key={`c${c.slot}`}
                x={c.x}
                y={c.y}
                fill={accent}
                opacity={claimOpacity * c.appear}
                scale={(0.55 + 0.45 * c.appear) * c.lift}
              />
            ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default TwoLabsGridCapture;
