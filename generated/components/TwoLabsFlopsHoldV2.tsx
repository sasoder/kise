import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:35.619 -> 00:00:41.280 of Dylan_Two_Labs2. round(5.661 * 30) = 170.
export const DURATION = 170;

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
const SEED_CX = ((SEED_SLOTS[0] % COLS) + (SEED_SLOTS[1] % COLS)) / 2;
const SEED_CY = Math.floor(SEED_SLOTS[0] / COLS);

const ENTER = 10;
const PRESSURE_LEAD = 10;
// How long a held cell takes to close up, and how far the setting runs out
// from the seeds.
const FUSE = 20;
const FUSE_SPREAD = 18;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const slotX = (slot: number) => X0 + (slot % COLS) * PITCH;
const slotY = (slot: number) => Y0 + Math.floor(slot / COLS) * PITCH;

const backOut = (t: number, s = 1.3) => {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

// Stable per-cell scatter: organic, and identical on every frame.
const hash = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const seedDist = (slot: number) =>
  Math.hypot((slot % COLS) - SEED_CX, Math.floor(slot / COLS) - SEED_CY);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  fadedOpacity: z.number().min(0).max(1),
  claimOpacity: z.number().min(0).max(1),
  pressureOpacity: z.number().min(0).max(1),
  // Roughens the frontier just enough to stop it advancing in visible rings,
  // while keeping the holding contiguous.
  roughness: z.number().min(0).max(1),
  counts: z.object({
    controlling: z.number(),
    usable: z.number(),
    world: z.number(),
  }),
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

export type TwoLabsFlopsHoldV2Props = z.infer<typeof schema>;

export const defaultProps: TwoLabsFlopsHoldV2Props = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.1,
  fadedOpacity: 0.06,
  claimOpacity: 0.92,
  pressureOpacity: 0.22,
  roughness: 0.18,
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

const TwoLabsFlopsHoldV2: React.FC<TwoLabsFlopsHoldV2Props> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  fadedOpacity,
  claimOpacity,
  pressureOpacity,
  roughness,
  counts,
  fusedCell,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const at = (f: number, a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    interpolate(f, [a, b], [0, 1], {easing, ...clamp});

  const ease = (a: number, b: number, easing = Easing.out(Easing.cubic)) =>
    at(frame, a, b, easing);

  const worldIn = ease(beats.world - 12, beats.world + 12);

  const order = React.useMemo(() => {
    const rest = Array.from({length: TOTAL}, (_, slot) => slot)
      .filter((slot) => !SEED_SLOTS.includes(slot))
      .map((slot) => ({slot, score: seedDist(slot) + hash(slot) * roughness}))
      .sort((a, b) => a.score - b.score);
    const orderOf = new Array<number>(TOTAL).fill(0);
    SEED_SLOTS.forEach((slot, i) => {
      orderOf[slot] = i;
    });
    rest.forEach((entry, i) => {
      orderOf[entry.slot] = i + SEED_SLOTS.length;
    });
    return orderOf;
  }, [roughness]);

  const countAt = React.useCallback(
    (f: number) => {
      const step = (a: number, b: number, delta: number, easing = Easing.out(Easing.cubic)) =>
        interpolate(f, [a, b], [0, delta], {easing, ...clamp});
      return (
        SEED_SLOTS.length +
        step(beats.spread, beats.usable, counts.controlling - SEED_SLOTS.length) +
        step(beats.usable, beats.flops, counts.usable - counts.controlling, Easing.inOut(Easing.cubic)) +
        step(beats.flops, beats.settled, counts.world - counts.usable, Easing.out(Easing.quad))
      );
    },
    [beats, counts],
  );

  // The frame each cell is taken on. Deriving the entrance from this rather
  // than from the width of the front means every cell takes the same time to
  // land however fast the front happens to be moving.
  const arrivals = React.useMemo(() => {
    return Array.from({length: TOTAL}, (_, p) => {
      if (p < SEED_SLOTS.length) return beats.seeds + p * 4 - 2;
      // A cell is taken once the count reaches it, i.e. crosses p + 1.
      if (countAt(DURATION) < p + 1) return Infinity;
      let lo = 0;
      let hi = DURATION;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (countAt(mid) >= p + 1) hi = mid;
        else lo = mid;
      }
      return hi;
    });
  }, [countAt, beats]);

  const cells = Array.from({length: TOTAL}, (_, slot) => {
    const p = order[slot];
    const a = arrivals[p];
    const finite = Number.isFinite(a);
    const appear = finite ? at(frame, a, a + ENTER) : 0;
    const pressure =
      appear > 0 || p < SEED_SLOTS.length ? 0 : finite ? at(frame, a - PRESSURE_LEAD, a) : 0;
    // The holding sets from the seeds outward, so the mass closes up the same
    // way it was taken.
    const fuse = at(frame, beats.own + (p / TOTAL) * FUSE_SPREAD, beats.own + (p / TOTAL) * FUSE_SPREAD + FUSE);
    return {slot, appear, pressure, fuse};
  });

  const rest = dimOpacity + (fadedOpacity - dimOpacity) * ease(beats.own, beats.own + FUSE + FUSE_SPREAD);

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
          {cells.map((c) => (
            <Cell
              key={`w${c.slot}`}
              slot={c.slot}
              fill={ink}
              opacity={rest * worldIn}
              size={CELL}
              radius={RADIUS}
            />
          ))}

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

          {cells
            .filter((c) => c.appear > 0.002)
            .map((c) => {
              const held = CELL + (fusedCell - CELL) * c.fuse;
              return (
                <Cell
                  key={`h${c.slot}`}
                  slot={c.slot}
                  fill={accent}
                  opacity={claimOpacity * c.appear}
                  size={held * (0.52 + 0.48 * backOut(c.appear))}
                  radius={RADIUS - 4 * c.fuse}
                />
              );
            })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default TwoLabsFlopsHoldV2;
