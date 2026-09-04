import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 5.960s -> 9.919s of the source cut, rounded up to a clean 4s.
export const DURATION = 120;

// ---------------------------------------------------------------------------
// Code block geometry. Everything is authored around the block's centre so the
// wave, the fold and the graph all share one origin.
// ---------------------------------------------------------------------------
const BLOCK_W = 700;
const LINE_H = 44;
const GROUP_GAP = 26;
const BAR_H = 13;
const INDENT = 46;
const NODE_R = 23;

// A group is one unit of code — a function, a module — and collapses into
// exactly one node, so the fold reads as "text became structure" rather than
// as bars scattering.
const GROUPS = [3, 2, 4, 2, 3, 2];

// Stable per-bar scatter: same shape every frame and every render.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Bar = {rx: number; ry: number; w: number; group: number; dist: number};

const laidOut = (() => {
  const raw: {x: number; y: number; w: number; group: number}[] = [];
  let y = 0;
  let i = 0;
  GROUPS.forEach((lines, g) => {
    for (let l = 0; l < lines; l++) {
      const last = l === lines - 1;
      // Level 0 opens the block, the body sits one or two levels in, and a
      // multi-line group closes back out one level. Reads as code without
      // ever drawing a glyph.
      const level = l === 0 ? 0 : last && lines > 2 ? 1 : hash(i, 1) > 0.72 ? 2 : 1;
      const x = level * INDENT;
      const room = BLOCK_W - x;
      const w = room * (level === 0 ? 0.55 + hash(i, 2) * 0.3 : 0.3 + hash(i, 3) * 0.48);
      raw.push({x, y, w, group: g});
      y += LINE_H;
      i++;
    }
    y += GROUP_GAP;
  });
  const blockH = raw[raw.length - 1].y + BAR_H;
  const bars: Bar[] = raw.map((b) => {
    const rx = b.x - BLOCK_W / 2;
    const ry = b.y - blockH / 2;
    return {rx, ry, w: b.w, group: b.group, dist: Math.hypot(rx + b.w / 2, ry + BAR_H / 2)};
  });
  return {bars, blockH};
})();

const BARS = laidOut.bars;
const MAX_DIST = Math.max(...BARS.map((b) => b.dist));

// Where each group lands once it has been understood. Hand-placed rather than
// generated: a dependency graph should look composed, not simulated.
const NODES = [
  {x: -34, y: -336},
  {x: -318, y: -148},
  {x: 302, y: -84},
  {x: -146, y: 118},
  {x: 231, y: 206},
  {x: 28, y: 396},
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 4],
  [3, 5],
  [4, 5],
  [0, 3],
  [1, 4],
];

// Groups fold in order of their distance from the centre, so the restructure
// follows the wave instead of running against it.
const GROUP_RANK = (() => {
  const meanDist = GROUPS.map((_, g) => {
    const gb = BARS.filter((b) => b.group === g);
    return gb.reduce((s, b) => s + b.dist, 0) / gb.length;
  });
  const rank = new Array<number>(GROUPS.length).fill(0);
  meanDist
    .map((d, g) => ({d, g}))
    .sort((a, b) => a.d - b.d)
    .forEach((o, idx) => {
      rank[o.g] = idx;
    });
  return rank;
})();

export const schema = z.object({
  // Unread code and read code are the same ink at two opacities; the accent is
  // reserved for comprehension, so the piece stays mono plus one colour.
  ink: z.string(),
  accent: z.string(),
  // Just enough dark spill to hold the shapes off light footage.
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  // The overlay carries no background, so it has to be placeable in the edit.
  centerY: z.number().min(400).max(1520),
  scale: z.number().min(0.5).max(1.4),
  // Beat frames lifted straight from the SRT at 30fps, relative to 00:00:05.960:
  //   31 "how fast" · 53 "ais can like" · 74 "understand" · 89 "a new code base"
  beats: z.object({
    sweep: z.number().int().min(0),
    fold: z.number().int().min(0),
    wire: z.number().int().min(0),
    resolve: z.number().int().min(0),
  }),
});

export type CodebaseComprehensionFoldProps = z.infer<typeof schema>;

export const defaultProps: CodebaseComprehensionFoldProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.22,
  readOpacity: 0.95,
  centerY: 960,
  scale: 1,
  beats: {sweep: 31, fold: 53, wire: 74, resolve: 89},
});

const CodebaseComprehensionFold: React.FC<CodebaseComprehensionFoldProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  readOpacity,
  centerY,
  scale,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const {sweep, fold, wire, resolve} = beats;
  const foldSpan = wire - fold;

  // The wavefront. Decelerating, so it leaves at speed on "how fast" and has
  // already crossed the block before the ear catches up.
  const waveR = interpolate(frame, [sweep, fold], [0, MAX_DIST * 1.12], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = interpolate(frame, [resolve - 2, resolve + 6, resolve + 24], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Resolve with a small settle, then a slow breathe so the hold is not frozen.
  const settle = interpolate(frame, [resolve, resolve + 16], [1.035, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const breathe = frame > resolve ? 1 + 0.012 * Math.sin((frame - resolve) / 24) : 1;

  const groupFold = (group: number) => {
    const start = fold + (GROUP_RANK[group] / (GROUPS.length - 1)) * foldSpan * 0.45;
    return interpolate(frame, [start, start + foldSpan * 0.8], [0, 1], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g
          transform={`translate(${width / 2} ${centerY}) scale(${scale * settle * breathe})`}
          style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
        >
          {/* Structure sits under the code, so the graph forms behind it. */}
          <g>
            {EDGES.map(([a, b], j) => {
              const A = NODES[a];
              const B = NODES[b];
              const len = Math.hypot(B.x - A.x, B.y - A.y);
              const start = wire + (j / EDGES.length) * (resolve - wire) * 0.7;
              const p = interpolate(frame, [start, start + 8], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <line
                  key={`e${j}`}
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke={accent}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - p)}
                  opacity={p * (0.5 + 0.4 * pulse)}
                />
              );
            })}

            <circle
              cx={0}
              cy={0}
              r={Math.max(waveR, 0)}
              fill="none"
              stroke={accent}
              strokeWidth={3}
              opacity={interpolate(frame, [sweep, sweep + 4, fold - 2, fold + 5], [0, 0.75, 0.45, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}
            />
          </g>

          {BARS.map((b, i) => {
            const enter = interpolate(frame, [i * 1.1, i * 1.1 + 12], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            // Read state is driven by the visible wavefront, not by a timer, so
            // the two can never drift apart.
            const lit = interpolate(waveR - b.dist, [0, 90], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const flash = interpolate(waveR - b.dist, [-10, 30, 140], [0, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const p = groupFold(b.group);
            const n = NODES[b.group];
            const w = Math.max(b.w * (1 - p), 0);
            const x = lerp(b.rx + b.w / 2, n.x, p) - w / 2 - (1 - enter) * 18;
            const y = lerp(b.ry + BAR_H / 2, n.y, p) - BAR_H / 2;
            const opacity =
              (dimOpacity + (readOpacity - dimOpacity) * lit) *
              enter *
              (1 -
                interpolate(p, [0.5, 1], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }));

            return (
              <g key={`b${i}`} opacity={opacity}>
                <rect x={x} y={y} width={w} height={BAR_H} rx={BAR_H / 2} fill={ink} />
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={BAR_H}
                  rx={BAR_H / 2}
                  fill={accent}
                  opacity={flash}
                />
              </g>
            );
          })}

          <g>
            {NODES.map((n, g) => {
              const p = groupFold(g);
              const pop = interpolate(p, [0.62, 1], [0, 1], {
                easing: Easing.bezier(0.2, 1.5, 0.4, 1),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const r = Math.max(NODE_R * pop * (1 + 0.28 * pulse), 0);
              return (
                <g key={`n${g}`}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r + 14 + 34 * pulse}
                    fill="none"
                    stroke={accent}
                    strokeWidth={2}
                    opacity={0.45 * pulse}
                  />
                  <circle cx={n.x} cy={n.y} r={r} fill={accent} />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default CodebaseComprehensionFold;
