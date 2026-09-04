import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:35.619 -> 00:00:41.280 of Dylan_Two_Labs2. round(5.661 * 30) = 170.
export const DURATION = 170;

// Deliberately the same field as TwoLabsGridCapture, which opened this
// segment: same 10x10 world, same cell, same seed pair at the bottom centre.
// The takeover there was patchy and scattered; here it is one solid front,
// because the line is about control rather than about share.
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

const SEED_SLOTS = [9 * COLS + 4, 9 * COLS + 5];
const SEED_CX = (SEED_SLOTS[0] % COLS + SEED_SLOTS[1] % COLS) / 2;
const SEED_CY = Math.floor(SEED_SLOTS[0] / COLS);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const slotX = (slot: number) => X0 + (slot % COLS) * PITCH;
const slotY = (slot: number) => Y0 + Math.floor(slot / COLS) * PITCH;

const seedDist = (slot: number) =>
  Math.hypot((slot % COLS) - SEED_CX, Math.floor(slot / COLS) - SEED_CY);

// Claim order is distance from the two labs and nothing else. No scatter: the
// front stays contiguous, so what spreads is a single holding rather than a
// growing collection of holdings.
const ORDER = (() => {
  const rest = Array.from({length: TOTAL}, (_, slot) => slot)
    .filter((slot) => !SEED_SLOTS.includes(slot))
    .sort((a, b) => seedDist(a) - seedDist(b) || a - b);
  const orderOf = new Array<number>(TOTAL).fill(0);
  SEED_SLOTS.forEach((slot, i) => {
    orderOf[slot] = i;
  });
  rest.forEach((slot, i) => {
    orderOf[slot] = i + SEED_SLOTS.length;
  });
  return orderOf;
})();

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  // Where the unclaimed world goes once the holding closes up.
  fadedOpacity: z.number().min(0).max(1),
  claimOpacity: z.number().min(0).max(1),
  pressureOpacity: z.number().min(0).max(1),
  // Cells held at each landing, out of 100.
  counts: z.object({
    controlling: z.number(),
    usable: z.number(),
    world: z.number(),
  }),
  // How wide a held cell grows on the last beat. Short of the full pitch, so
  // the holding fuses into one mass but still reads as made of machines.
  fusedCell: z.number(),
  // Beat frames from the SRT at 30fps, relative to 00:00:35.619:
  //     0 "you've got"   ·  10 "them just"   ·  31 "controlling"
  //    44 "most of"      ·  70 "the usable"  ·  86 "you know"
  //   113 "flops in"     · 132 "the world"   · 143 "on their own"
  beats: z.object({
    world: z.number().int(),
    seeds: z.number().int(),
    spread: z.number().int(),
    usable: z.number().int(),
    flops: z.number().int(),
    settled: z.number().int(),
    own: z.number().int(),
  }),
});

export type TwoLabsFlopsHoldProps = z.infer<typeof schema>;

export const defaultProps: TwoLabsFlopsHoldProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.1,
  fadedOpacity: 0.08,
  claimOpacity: 0.92,
  pressureOpacity: 0.22,
  counts: {controlling: 24, usable: 50, world: 72},
  fusedCell: 84,
  beats: {
    world: 0,
    seeds: 10,
    spread: 31,
    usable: 70,
    flops: 113,
    settled: 145,
    own: 143,
  },
});

const APPEAR_WINDOW = 1.2;
const PRESSURE_LEAD = 3.5;

const TwoLabsFlopsHold: React.FC<TwoLabsFlopsHoldProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  fadedOpacity,
  claimOpacity,
  pressureOpacity,
  counts,
  fusedCell,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ease = (a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});

  const step = (a: number, b: number, delta: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(frame, [a, b], [0, delta], {easing, ...clamp});

  // The cut opens mid-sentence: the world is already half there on frame 0.
  const worldIn = ease(beats.world - 12, beats.world + 12);

  // The front never pauses; each phrase just gives it another push.
  const count =
    SEED_SLOTS.length +
    step(beats.spread, beats.usable, counts.controlling - SEED_SLOTS.length) +
    step(beats.usable, beats.flops, counts.usable - counts.controlling, Easing.inOut(Easing.cubic)) +
    step(beats.flops, beats.settled, counts.world - counts.usable, Easing.out(Easing.quad));

  // "on their own": the held cells close up into a single mass and the rest of
  // the world recedes behind it.
  const fuse = ease(beats.own, beats.own + 24);
  const cellSize = CELL + (fusedCell - CELL) * fuse;
  const cellRadius = RADIUS - 4 * fuse;
  const restOpacity = dimOpacity + (fadedOpacity - dimOpacity) * fuse;

  const cells = Array.from({length: TOTAL}, (_, slot) => {
    const p = ORDER[slot];
    const appear =
      p < SEED_SLOTS.length
        ? ease(beats.seeds + p * 4 - 2, beats.seeds + p * 4 + 10)
        : interpolate(count - p, [0, APPEAR_WINDOW], [0, 1], clamp);
    const pressure =
      appear > 0
        ? 0
        : ease(beats.spread - 6, beats.spread + 8) *
          interpolate(count - p, [-PRESSURE_LEAD, 0], [0, 1], clamp);
    return {slot, appear, pressure};
  });

  const Cell: React.FC<{
    slot: number;
    fill: string;
    opacity: number;
    size: number;
    radius: number;
  }> = ({slot, fill, opacity, size, radius}) => (
    <rect
      x={slotX(slot) + (CELL - size) / 2}
      y={slotY(slot) + (CELL - size) / 2}
      width={size}
      height={size}
      rx={Math.max(0, radius)}
      fill={fill}
      opacity={opacity}
    />
  );

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The world's usable flops. */}
          {cells.map((c) => (
            <Cell
              key={`w${c.slot}`}
              slot={c.slot}
              fill={ink}
              opacity={restOpacity * worldIn}
              size={CELL}
              radius={RADIUS}
            />
          ))}

          {/* What the front is about to take. */}
          {cells
            .filter((c) => c.pressure > 0.002)
            .map((c) => (
              <Cell
                key={`p${c.slot}`}
                slot={c.slot}
                fill={ink}
                opacity={pressureOpacity * c.pressure}
                size={CELL}
                radius={RADIUS}
              />
            ))}

          {/* Held. */}
          {cells
            .filter((c) => c.appear > 0.002)
            .map((c) => (
              <Cell
                key={`h${c.slot}`}
                slot={c.slot}
                fill={accent}
                opacity={claimOpacity * c.appear}
                size={(CELL + (cellSize - CELL) * c.appear) * (0.55 + 0.45 * c.appear)}
                radius={cellRadius}
              />
            ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default TwoLabsFlopsHold;
