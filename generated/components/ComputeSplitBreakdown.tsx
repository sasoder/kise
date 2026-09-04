import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 24;
// 00:00:22.879 -> 00:00:34.560 of the source cut. round(11.681 * 24) = 280.
export const DURATION = 280;

// Fractions of the whole compute budget. The bar is always exactly 100% wide,
// so the only thing that ever moves is where the seams fall — which is what
// makes "research is bigger than inference" readable at the end with no legend.
const RESEARCH_END = 0.5;
const TRAINING_END = 0.6;
const RADIUS = 10;

// Half-pixel snap with an odd stroke width: identical edges otherwise antialias
// anywhere from 4% to 13% alpha and the whole field shimmers as the camera moves.
const snap = (v: number) => Math.round(v) + 0.5;

const pct = (f: number) => `${Math.round(f * 100)}%`;

const barPath = (x: number, y: number, w: number, h: number, rl: boolean, rr: boolean) => {
  const r = Math.max(0, Math.min(RADIUS, w / 2, h / 2));
  const l = rl ? r : 0;
  const g = rr ? r : 0;
  return [
    `M${x + l},${y}`,
    `H${x + w - g}`,
    g ? `A${g},${g} 0 0 1 ${x + w},${y + g}` : '',
    `V${y + h - g}`,
    g ? `A${g},${g} 0 0 1 ${x + w - g},${y + h}` : '',
    `H${x + l}`,
    l ? `A${l},${l} 0 0 1 ${x},${y + h - l}` : '',
    `V${y + l}`,
    l ? `A${l},${l} 0 0 1 ${x + l},${y}` : '',
    'Z',
  ]
    .filter(Boolean)
    .join(' ');
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  litOpacity: z.number().min(0).max(1),
  // Where a quantity sits once it has been broken open but not yet named.
  pendingOpacity: z.number().min(0).max(1),
  outlineOpacity: z.number().min(0).max(1),
  // Inference while the camera is in close on training: still there, still
  // visible at the frame edge, but no longer the subject.
  contextOpacity: z.number().min(0).max(1),
  bar: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  gutter: z.number(),
  // Chosen so the 60% block fills ~860px of the 1080 frame when the camera is in.
  zoom: z.number().min(1).max(3),
  labels: z.object({
    training: z.string(),
    inference: z.string(),
    research: z.string(),
    development: z.string(),
  }),
  // Beat frames lifted from the SRT at 24fps, relative to 00:00:22.879:
  //   0 "historically" · 21 "like 60" · 36 "training 40" · 64 "inference"
  //   77 "but that" · 84 "training gets" · 98 "broken down" · 109 "further"
  //   124 "and as it's" · 137 "like 50 of the" · 164 "compute is" · 181 "research"
  //   201 "like 10 of the" · 220 "compute is" · 229 "development"
  //   241 "and then 40 is" · 272 "inference"
  beats: z.object({
    total: z.number().int(),
    sixty: z.number().int(),
    training: z.number().int(),
    forty: z.number().int(),
    inference: z.number().int(),
    push: z.number().int(),
    crack: z.number().int(),
    pending: z.number().int(),
    researchFill: z.number().int(),
    research: z.number().int(),
    devFill: z.number().int(),
    development: z.number().int(),
    pull: z.number().int(),
  }),
});

export type ComputeSplitBreakdownProps = z.infer<typeof schema>;

export const defaultProps: ComputeSplitBreakdownProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  litOpacity: 0.92,
  pendingOpacity: 0.14,
  outlineOpacity: 0.5,
  contextOpacity: 0.28,
  bar: {x: 80, y: 500, w: 920, h: 124},
  gutter: 11,
  zoom: 1.55,
  labels: {
    training: 'TRAINING',
    inference: 'INFERENCE',
    research: 'RESEARCH',
    development: 'DEVELOPMENT',
  },
  beats: {
    total: 0,
    sixty: 21,
    training: 36,
    forty: 48,
    inference: 64,
    push: 84,
    crack: 98,
    pending: 109,
    researchFill: 137,
    research: 181,
    devFill: 205,
    development: 229,
    pull: 239,
  },
});

const Cap: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  bottomAligned?: boolean;
  shadow: string;
  children: React.ReactNode;
}> = ({x, y, size, color, opacity, bottomAligned, shadow, children}) => {
  if (opacity <= 0.001) {
    return null;
  }
  // A full-width row centred on x, so the negative right margin that cancels the
  // trailing letter-space is actually accounted for when the line is centred.
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 540,
        width: 1080,
        top: y,
        transform: bottomAligned ? 'translateY(-100%)' : undefined,
        display: 'flex',
        justifyContent: 'center',
        fontFamily: roboto.fontFamily,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        color,
        opacity,
        filter: `drop-shadow(0 2px 6px ${shadow})`,
      }}
    >
      <span style={{letterSpacing: '0.11em', marginRight: '-0.11em', whiteSpace: 'nowrap'}}>
        {children}
      </span>
    </div>
  );
};

const ComputeSplitBreakdown: React.FC<ComputeSplitBreakdownProps> = ({
  ink,
  accent,
  shadow,
  litOpacity,
  pendingOpacity,
  outlineOpacity,
  contextOpacity,
  bar,
  gutter,
  zoom: maxZoom,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  // Motion lengths are authored as frame counts at 30fps and resampled off the
  // composition's real rate, so changing fps resamples the motion rather than
  // retiming it. Beat frames come from the SRT and are already in this rate.
  const dur = (frames30: number) => (frames30 * fps) / 30;

  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const smooth = {easing: Easing.inOut(Easing.cubic), ...clamp};
  const settle = {easing: Easing.out(Easing.cubic), ...clamp};

  const barCx = bar.x + bar.w / 2;
  const trainCx = bar.x + (TRAINING_END / 2) * bar.w;
  const cy = bar.y + bar.h / 2;

  // "but that training gets broken down further" is literally an instruction to
  // go closer, so the camera obeys it — and pulls back out for "and then 40 is
  // inference", which only lands if the 40 is on screen beside the 50.
  const camKeys = [beats.push, beats.push + dur(34), beats.pull, beats.pull + dur(30)];
  const zoom = interpolate(frame, camKeys, [1, maxZoom, maxZoom, 1], smooth);
  const focusX = interpolate(frame, camKeys, [barCx, trainCx, trainCx, barCx], smooth);

  // Geometry is projected in JS rather than pushed through an SVG transform, so
  // stroke weights and type stay at their designed size right through the move.
  const px = (x: number) => (x - focusX) * zoom + width / 2;
  const py = (y: number) => (y - cy) * zoom + cy;
  const wx = (frac: number) => px(bar.x + frac * bar.w);

  // Both seams are gaps in the bar, not rules drawn over it — one grammar for
  // "these are separate quantities", used twice.
  const gapA = interpolate(frame, [beats.sixty, beats.sixty + dur(16)], [0, gutter], settle);
  const gapB = interpolate(frame, [beats.crack, beats.crack + dur(20)], [0, gutter], {
    easing: Easing.bezier(0.2, 1.6, 0.4, 1),
    ...clamp,
  });
  const splitA = gapA * zoom >= 0.5;
  const splitB = gapB * zoom >= 0.5;

  // Fill sweeps. A bigger share takes longer to draw, so every quantity is
  // stated twice: as a width and as a duration.
  const trainSweep = interpolate(frame, [beats.sixty + dur(4), beats.sixty + dur(30)], [0, 1], smooth);
  const infSweep = interpolate(frame, [beats.forty, beats.forty + dur(19)], [0, 1], smooth);
  const resSweep = interpolate(frame, [beats.researchFill, beats.research], [0, 1], smooth);
  const devSweep = interpolate(frame, [beats.devFill, beats.development], [0, 1], smooth);

  // "further": what you had already read goes back to being an open question,
  // so the two halves can each be answered in turn.
  const recede = interpolate(frame, [beats.pending, beats.pending + dur(14)], [0, 1], smooth);
  const subBase = litOpacity + (pendingOpacity - litOpacity) * recede;

  const infOpacity = interpolate(
    frame,
    [beats.push, beats.push + dur(22), beats.pull + dur(14), beats.pull + dur(40)],
    [litOpacity, contextOpacity, contextOpacity, litOpacity],
    smooth,
  );

  const wipe = interpolate(frame, [beats.total, beats.total + dur(22)], [0, 1], settle);

  type Piece = {
    key: string;
    a: number;
    b: number;
    insetL: number;
    insetR: number;
    roundL: boolean;
    roundR: boolean;
    baseOpacity: number;
    litColor: string;
    litOpacity: number;
    p: number;
  };

  const inference: Piece = {
    key: 'inference',
    a: TRAINING_END,
    b: 1,
    insetL: gapA / 2,
    insetR: 0,
    roundL: false,
    roundR: true,
    baseOpacity: 0,
    litColor: ink,
    litOpacity: infOpacity,
    p: infSweep,
  };

  const pieces: Piece[] = !splitA
    ? [
        {
          key: 'whole',
          a: 0,
          b: 1,
          insetL: 0,
          insetR: 0,
          roundL: true,
          roundR: true,
          baseOpacity: 0,
          litColor: ink,
          litOpacity,
          p: 0,
        },
      ]
    : !splitB
      ? [
          {
            key: 'training',
            a: 0,
            b: TRAINING_END,
            insetL: 0,
            insetR: gapA / 2,
            roundL: true,
            roundR: false,
            baseOpacity: 0,
            litColor: ink,
            litOpacity,
            p: trainSweep,
          },
          inference,
        ]
      : [
          {
            key: 'research',
            a: 0,
            b: RESEARCH_END,
            insetL: 0,
            insetR: gapB / 2,
            roundL: true,
            roundR: false,
            baseOpacity: subBase,
            litColor: accent,
            litOpacity,
            p: resSweep,
          },
          {
            key: 'development',
            a: RESEARCH_END,
            b: TRAINING_END,
            insetL: gapB / 2,
            insetR: gapA / 2,
            roundL: false,
            roundR: false,
            baseOpacity: subBase,
            litColor: ink,
            litOpacity,
            p: devSweep,
          },
          inference,
        ];

  const top = snap(py(bar.y));
  const bottom = snap(py(bar.y + bar.h));
  const barH = bottom - top;

  const numY = top - 24;
  const row1Y = bottom + 28;
  const row2Y = bottom + 138;

  // Text opacities, each tied to the word it belongs to.
  const in60 = interpolate(frame, [beats.sixty + dur(2), beats.sixty + dur(12)], [0, 1], settle);
  const out60 = interpolate(frame, [beats.crack + dur(4), beats.crack + dur(18)], [1, 0], settle);
  const inTraining = interpolate(frame, [beats.training - dur(6), beats.training + dur(6)], [0, 1], settle);
  const outTraining = interpolate(frame, [beats.pending, beats.pending + dur(14)], [1, 0], settle);
  const in40 = interpolate(frame, [beats.forty + dur(2), beats.forty + dur(12)], [0, 1], settle);
  const inInference = interpolate(
    frame,
    [beats.inference - dur(6), beats.inference + dur(6)],
    [0, 1],
    settle,
  );
  // Out as the camera leaves them behind, back as it returns.
  const context40 = interpolate(
    frame,
    [beats.push, beats.push + dur(12), beats.pull + dur(20), beats.pull + dur(34)],
    [1, 0, 0, 1],
    settle,
  );
  const contextLabel = interpolate(
    frame,
    [beats.push, beats.push + dur(12), beats.pull + dur(24), beats.pull + dur(38)],
    [1, 0, 0, 1],
    settle,
  );
  const in50 = interpolate(frame, [beats.researchFill, beats.researchFill + dur(12)], [0, 1], settle);
  // Crossfade rather than a hard swap: the figure turns accent as the block does.
  const accent50 = interpolate(frame, [beats.research - dur(10), beats.research + dur(4)], [0, 1], smooth);
  const inResearch = interpolate(frame, [beats.research - dur(8), beats.research + dur(4)], [0, 1], settle);
  const in10 = interpolate(frame, [beats.devFill - dur(5), beats.devFill + dur(7)], [0, 1], settle);
  const inDevelopment = interpolate(
    frame,
    [beats.development - dur(8), beats.development + dur(4)],
    [0, 1],
    settle,
  );

  // Development is 10% of the frame's width at most, so its label cannot sit
  // under it. It gets its own row and a stem instead.
  const devCx = wx((RESEARCH_END + TRAINING_END) / 2);
  const stemTop = bottom + 14;
  const stemBottom = row2Y - 26;
  const stemLen = stemBottom - stemTop + Math.abs(width / 2 - devCx);
  const stemDraw = interpolate(
    frame,
    [beats.development - dur(8), beats.development + dur(8)],
    [0, 1],
    settle,
  );

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id="csb-wipe">
            <rect
              x={wx(0) - 40}
              y={0}
              width={(wx(1) - wx(0)) * wipe + 40}
              height={height}
            />
          </clipPath>
          {pieces.map((piece) => {
            const x = snap(wx(piece.a) + piece.insetL * zoom);
            const w = snap(wx(piece.b) - piece.insetR * zoom) - x;
            return (
              <React.Fragment key={piece.key}>
                <clipPath id={`csb-lit-${piece.key}`}>
                  <rect x={x} y={top} width={Math.max(0, w * piece.p)} height={barH} />
                </clipPath>
                <clipPath id={`csb-base-${piece.key}`}>
                  <rect
                    x={x + w * piece.p}
                    y={top}
                    width={Math.max(0, w * (1 - piece.p))}
                    height={barH}
                  />
                </clipPath>
              </React.Fragment>
            );
          })}
        </defs>

        <g clipPath="url(#csb-wipe)" style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {pieces.map((piece) => {
            const x = snap(wx(piece.a) + piece.insetL * zoom);
            const w = snap(wx(piece.b) - piece.insetR * zoom) - x;
            if (w <= 0) {
              return null;
            }
            const d = barPath(x, top, w, barH, piece.roundL, piece.roundR);
            return (
              <g key={piece.key}>
                {/* Unnamed remainder — the outline says the container exists,
                    the dim fill says the quantity is not settled yet. */}
                {piece.baseOpacity > 0 ? (
                  <g clipPath={`url(#csb-base-${piece.key})`}>
                    <path d={d} fill={ink} opacity={piece.baseOpacity} />
                  </g>
                ) : null}
                {piece.p > 0 ? (
                  <g clipPath={`url(#csb-lit-${piece.key})`}>
                    <path d={d} fill={piece.litColor} opacity={piece.litOpacity} />
                  </g>
                ) : null}
                <path
                  d={d}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3}
                  opacity={outlineOpacity * (piece.key === 'inference' ? infOpacity / litOpacity : 1)}
                />
              </g>
            );
          })}

          {inDevelopment > 0.001 ? (
            <path
              d={`M${snap(devCx)},${stemTop} V${stemBottom} H${snap(width / 2)}`}
              fill="none"
              stroke={ink}
              strokeWidth={3}
              strokeDasharray={stemLen}
              strokeDashoffset={stemLen * (1 - stemDraw)}
              opacity={outlineOpacity * 1.2 * inDevelopment}
            />
          ) : null}
        </g>
      </svg>

      <Cap
        x={wx(TRAINING_END / 2)}
        y={numY}
        size={68}
        color={ink}
        opacity={in60 * out60 * litOpacity}
        bottomAligned
        shadow={shadow}
      >
        {pct(TRAINING_END)}
      </Cap>
      <Cap
        x={wx(TRAINING_END / 2)}
        y={row1Y}
        size={58}
        color={ink}
        opacity={inTraining * outTraining * litOpacity}
        shadow={shadow}
      >
        {labels.training}
      </Cap>

      <Cap
        x={wx((1 + TRAINING_END) / 2)}
        y={numY}
        size={68}
        color={ink}
        opacity={in40 * context40 * litOpacity}
        bottomAligned
        shadow={shadow}
      >
        {pct(1 - TRAINING_END)}
      </Cap>
      <Cap
        x={wx((1 + TRAINING_END) / 2)}
        y={row1Y}
        size={58}
        color={ink}
        opacity={inInference * contextLabel * litOpacity}
        shadow={shadow}
      >
        {labels.inference}
      </Cap>

      <Cap
        x={wx(RESEARCH_END / 2)}
        y={numY}
        size={68}
        color={ink}
        opacity={in50 * (1 - accent50) * litOpacity}
        bottomAligned
        shadow={shadow}
      >
        {pct(RESEARCH_END)}
      </Cap>
      <Cap
        x={wx(RESEARCH_END / 2)}
        y={numY}
        size={68}
        color={accent}
        opacity={in50 * accent50 * litOpacity}
        bottomAligned
        shadow={shadow}
      >
        {pct(RESEARCH_END)}
      </Cap>
      <Cap
        x={wx(RESEARCH_END / 2)}
        y={row1Y}
        size={58}
        color={accent}
        opacity={inResearch * litOpacity}
        shadow={shadow}
      >
        {labels.research}
      </Cap>

      <Cap
        x={devCx}
        y={numY}
        size={68}
        color={ink}
        opacity={in10 * litOpacity}
        bottomAligned
        shadow={shadow}
      >
        {pct(TRAINING_END - RESEARCH_END)}
      </Cap>
      <Cap
        x={width / 2}
        y={row2Y}
        size={58}
        color={ink}
        opacity={inDevelopment * litOpacity}
        shadow={shadow}
      >
        {labels.development}
      </Cap>
    </AbsoluteFill>
  );
};

export default ComputeSplitBreakdown;
