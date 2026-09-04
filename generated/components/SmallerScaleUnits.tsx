import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:22.140 -> 00:00:28.000 of the source cut. round(5.860 * 30) = 176.
export const DURATION = 176;

// The mass is conserved. Every person in the last frame came out of a block in
// the first one, so the claim is not "fewer people" — it is the same people at
// a different grain. The container is the business, and it is the only thing
// that changes size.

const DOT_R = 12;
const PITCH = 44;
const BLOCK_PAD = 24;
const CLUSTER_PAD = 11;
const TRAVEL = 22;

// Fourteen of them, no two the same shape. "All sorts of businesses" is carried
// by the variety of the containers, not by labelling any of them.
const BLOCKS = [
  {x: 121, y: 416, cols: 5, rows: 5},
  {x: 416, y: 456, cols: 4, rows: 3},
  {x: 676, y: 436, cols: 3, rows: 3},
  {x: 896, y: 486, cols: 2, rows: 2},
  {x: 146, y: 756, cols: 3, rows: 4},
  {x: 366, y: 816, cols: 4, rows: 2},
  {x: 636, y: 776, cols: 2, rows: 4},
  {x: 816, y: 806, cols: 3, rows: 2},
  {x: 176, y: 1096, cols: 2, rows: 3},
  {x: 366, y: 1126, cols: 4, rows: 2},
  {x: 676, y: 1136, cols: 2, rows: 2},
  {x: 856, y: 1126, cols: 3, rows: 3},
];

const GRID = {cols: 8, rows: 9, x: 80, y: 380, w: 920, h: 1200};
const CELL_W = GRID.w / GRID.cols;
const CELL_H = GRID.h / GRID.rows;

const frac = (v: number) => v - Math.floor(v);
const hash = (i: number, k: number) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

const OFFSETS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-18, 0],
    [18, 0],
  ],
  3: [
    [0, -18],
    [-17, 11],
    [17, 11],
  ],
  4: [
    [-18, -18],
    [18, -18],
    [-18, 18],
    [18, 18],
  ],
};

type Source = {x: number; y: number; block: number; used: boolean};

const sources: Source[] = [];
BLOCKS.forEach((b, bi) => {
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      sources.push({x: b.x + c * PITCH, y: b.y + r * PITCH, block: bi, used: false});
    }
  }
});

const blockBounds = BLOCKS.map((b) => ({
  x: b.x - DOT_R - BLOCK_PAD,
  y: b.y - DOT_R - BLOCK_PAD,
  w: (b.cols - 1) * PITCH + 2 * (DOT_R + BLOCK_PAD),
  h: (b.rows - 1) * PITCH + 2 * (DOT_R + BLOCK_PAD),
}));

// Slots are walked in a scrambled order so the sizes that land are not laid out
// in reading order, and so the leftover empty slots fall irregularly.
const slotOrder: number[] = [];
for (let i = 0; i < GRID.cols * GRID.rows; i++) slotOrder.push(i);
slotOrder.sort((a, b) => hash(a, 51) - hash(b, 51));

type Cluster = {
  size: number;
  cx: number;
  cy: number;
  members: [number, number][];
  x: number;
  y: number;
  w: number;
  h: number;
};

const clusters: Cluster[] = [];
let remaining = sources.length;
for (let s = 0; s < slotOrder.length && remaining > 0; s++) {
  const slot = slotOrder[s];
  const col = slot % GRID.cols;
  const row = Math.floor(slot / GRID.cols);
  const h1 = hash(slot, 21);
  // Half of them are one person. He says "individual entrepreneurs" first and
  // means it, so the field has to read as mostly ones with teams among them.
  let size = h1 < 0.5 ? 1 : h1 < 0.76 ? 2 : h1 < 0.91 ? 3 : 4;
  size = Math.min(size, remaining);
  remaining -= size;

  const cx = GRID.x + (col + 0.5) * CELL_W + (hash(slot, 22) * 2 - 1) * CELL_W * 0.13;
  const cy = GRID.y + (row + 0.5) * CELL_H + (hash(slot, 23) * 2 - 1) * CELL_H * 0.19;
  const spin =
    size === 4 ? 0 : size === 3 ? (hash(slot, 24) * 2 - 1) * 0.6 : hash(slot, 24) * Math.PI * 2;
  const cos = Math.cos(spin);
  const sin = Math.sin(spin);
  const members = OFFSETS[size].map(
    ([ox, oy]) => [cx + ox * cos - oy * sin, cy + ox * sin + oy * cos] as [number, number],
  );

  const xs = members.map((m) => m[0]);
  const ys = members.map((m) => m[1]);
  clusters.push({
    size,
    cx,
    cy,
    members,
    x: Math.min(...xs) - DOT_R - CLUSTER_PAD,
    y: Math.min(...ys) - DOT_R - CLUSTER_PAD,
    w: Math.max(...xs) - Math.min(...xs) + 2 * (DOT_R + CLUSTER_PAD),
    h: Math.max(...ys) - Math.min(...ys) + 2 * (DOT_R + CLUSTER_PAD),
  });
}

type Dot = {
  bx: number;
  by: number;
  tx: number;
  ty: number;
  ccx: number;
  ccy: number;
  block: number;
  cluster: number;
  depart: number;
};

// Each person is assigned to the nearest unclaimed destination, so the dispersal
// is short-pathed and legible rather than an explosion — you can follow any one
// dot from its desk to wherever it ends up.
const targets: {x: number; y: number; cluster: number}[] = [];
clusters.forEach((c, ci) => {
  c.members.forEach((m) => targets.push({x: m[0], y: m[1], cluster: ci}));
});
targets.sort((a, b) => hash(a.cluster * 7 + a.x, 61) - hash(b.cluster * 7 + b.x, 61));

const dots: Dot[] = [];
targets.forEach((t, ti) => {
  let best = -1;
  let bd = Infinity;
  for (let i = 0; i < sources.length; i++) {
    if (sources[i].used) continue;
    const d = (sources[i].x - t.x) ** 2 + (sources[i].y - t.y) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  if (best < 0) return;
  sources[best].used = true;
  const s = sources[best];
  dots.push({
    bx: s.x,
    by: s.y,
    tx: t.x,
    ty: t.y,
    ccx: clusters[t.cluster].cx,
    ccy: clusters[t.cluster].cy,
    block: s.block,
    cluster: t.cluster,
    depart: ti,
  });
});

const blockOrder = BLOCKS.map((_, i) => i).sort((a, b) => hash(a, 71) - hash(b, 71));
const blockRank = BLOCKS.map((_, i) => blockOrder.indexOf(i));

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OUT = Easing.out(Easing.cubic);
const SWING = Easing.inOut(Easing.cubic);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  blockOpacity: z.number().min(0).max(1),
  ghostOpacity: z.number().min(0).max(1),
  dotOpacity: z.number().min(0).max(1),
  // Beat frames lifted from the SRT at 30fps, relative to 00:00:22.140:
  //     0 "for all"       ·  15 "sorts of"      ·  23 "businesses"
  //    34 "to be lots"    ·  57 "of smaller"    ·  81 "scale"
  //    96 "individual"    · 111 "entrepreneurs" · 130 "or small"
  //   149 "teams all"
  beats: z.object({
    businesses: z.number().int(),
    lots: z.number().int(),
    individual: z.number().int(),
    small: z.number().int(),
  }),
});

export type SmallerScaleUnitsProps = z.infer<typeof schema>;

export const defaultProps: SmallerScaleUnitsProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#FFC543',
  shadow: 'rgba(0, 0, 0, 0.28)',
  blockOpacity: 0.17,
  ghostOpacity: 0.07,
  dotOpacity: 0.86,
  beats: {businesses: 23, lots: 34, individual: 96, small: 130},
});

const SmallerScaleUnits: React.FC<SmallerScaleUnitsProps> = ({
  ink,
  accent,
  shadow,
  blockOpacity,
  ghostOpacity,
  dotOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const blockIn = (bi: number) =>
    interpolate(frame, [-18 + blockRank[bi] * 3.2, -6 + blockRank[bi] * 3.2], [0, 1], {
      easing: OUT,
      ...clamp,
    });

  const departOf = (d: Dot) => beats.lots + blockRank[d.block] * 1.7 + hash(d.depart, 31) * 8;

  const travelOf = (d: Dot) => {
    const t = departOf(d);
    return interpolate(frame, [t, t + TRAVEL], [0, 1], {easing: SWING, ...clamp});
  };

  // The container resolves when its people have arrived: ones on "individual",
  // teams on "or small teams", and the teams staggered by headcount so the field
  // keeps assembling through to the end of the line.
  const resolveOf = (ci: number) => {
    const c = clusters[ci];
    const at =
      c.size === 1
        ? beats.individual + hash(ci, 41) * 13
        : beats.small + (c.size - 2) * 7 + hash(ci, 42) * 16;
    return interpolate(frame, [at, at + 9], [0, 1], {easing: OUT, ...clamp});
  };

  const blockDrain = BLOCKS.map(() => ({sum: 0, n: 0}));
  dots.forEach((d) => {
    blockDrain[d.block].sum += travelOf(d);
    blockDrain[d.block].n += 1;
  });

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The old shape of a business stays on screen after it empties. The
              claim is a change, and a change needs its before left visible. */}
          {blockBounds.map((b, i) => {
            const on = blockIn(i);
            if (on <= 0.002) return null;
            const drained = blockDrain[i].n ? blockDrain[i].sum / blockDrain[i].n : 0;
            const o = on * (blockOpacity - (blockOpacity - ghostOpacity) * drained);
            return (
              <rect
                key={`b${i}`}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={20}
                fill="none"
                stroke={ink}
                strokeWidth={3.5}
                opacity={o}
              />
            );
          })}

          {clusters.map((c, ci) => {
            const r = resolveOf(ci);
            if (r <= 0.002) return null;
            const s = 1.25 - 0.25 * r;
            const cx = c.x + c.w / 2;
            const cy = c.y + c.h / 2;
            return (
              <rect
                key={`c${ci}`}
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                rx={15}
                fill={accent}
                fillOpacity={0.07 * r}
                stroke={accent}
                strokeWidth={4}
                opacity={r}
                transform={`translate(${(cx * (1 - s)).toFixed(2)} ${(cy * (1 - s)).toFixed(2)}) scale(${s.toFixed(4)})`}
              />
            );
          })}

          {dots.map((d, i) => {
            const on = blockIn(d.block);
            if (on <= 0.002) return null;
            const t = travelOf(d);
            // A shallow arc off the straight line, biased away from the block's
            // own centre, so a hundred paths read as a spread and not a grid
            // sliding sideways.
            const mx = (d.bx + d.tx) / 2;
            const my = (d.by + d.ty) / 2;
            const nx = -(d.ty - d.by);
            const ny = d.tx - d.bx;
            const nl = Math.hypot(nx, ny) || 1;
            const bow = (hash(i, 33) * 2 - 1) * 64;
            const cx = mx + (nx / nl) * bow;
            const cy = my + (ny / nl) * bow;
            const u = 1 - t;
            const x = u * u * d.bx + 2 * u * t * cx + t * t * d.tx;
            const y = u * u * d.by + 2 * u * t * cy + t * t * d.ty;
            const o = on * dotOpacity * (0.64 + 0.36 * t) * (0.85 + 0.15 * resolveOf(d.cluster));
            return <circle key={`d${i}`} cx={x} cy={y} r={DOT_R} fill={ink} opacity={o} />;
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default SmallerScaleUnits;
