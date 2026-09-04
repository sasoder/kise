import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
// 00:00:33.780 -> 00:00:36.820 of the source cut is 73 frames; the extra 24
// let the resolved field sit before the editor's out point.
export const DURATION = 97;

const CANVAS = 1080;

const COLS = 10;
const ROWS = 10;
const BLOCKS = 3;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Plan view: flat transom at the left, long tapering bow at the right. The
// square stern is what separates a ship from a pill at this size.
const hullPath = (L: number, B: number) =>
  `M 0 0 L ${L * 0.62} 0 Q ${L * 0.9} ${B * 0.06} ${L} ${B * 0.5} Q ${L * 0.9} ${B * 0.94} ${L * 0.62} ${B} L 0 ${B} Z`;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  hullLength: z.number().min(20).max(200),
  hullBeam: z.number().min(6).max(80),
  stepX: z.number().min(20).max(240),
  stepY: z.number().min(8).max(120),
  // Gap between the three hundreds, before and after the resolve.
  blockGap: z.number().min(8).max(80),
  blockGapOpen: z.number().min(8).max(120),
  ruleOffset: z.number().min(4).max(40),
  ruleOverhang: z.number().min(0).max(60),
  // End caps turn each rule into a measured span: this much is one hundred.
  capHeight: z.number().min(0).max(40),
  bigScale: z.number().min(1.5).max(6),
  ghostOpacity: z.number().min(0).max(0.5),
  litOpacity: z.number().min(0.4).max(1),
  dimOpacity: z.number().min(0).max(0.8),
  railDim: z.number().min(0).max(0.6),
  railLit: z.number().min(0.4).max(1),
  slideIn: z.number().min(0).max(120),
  // Each hundred lands faster than the last: same count, less time.
  waveSpans: z.array(z.number()).length(3),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "and they're" · 7 "ultimately" · 18 "able to" · 29 "churn out"
  //   43 "hundreds and" · 50 "hundreds and" · 55 "hundreds" · 65 "of ships"
  beats: z.object({
    read: z.number().int(),
    rail: z.number().int(),
    launch: z.number().int(),
    berths: z.number().int(),
    wave1: z.number().int(),
    wave2: z.number().int(),
    wave3: z.number().int(),
    resolve: z.number().int(),
  }),
});

export type HundredsOfShipsProps = z.infer<typeof schema>;

export const defaultProps: HundredsOfShipsProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#FFC543',
  shadow: 'rgba(0, 0, 0, 0.28)',
  hullLength: 68,
  hullBeam: 15,
  stepX: 88,
  stepY: 29,
  blockGap: 34,
  blockGapOpen: 50,
  ruleOffset: 14,
  ruleOverhang: 12,
  capHeight: 10,
  bigScale: 4,
  ghostOpacity: 0.26,
  litOpacity: 0.85,
  dimOpacity: 0.4,
  railDim: 0.3,
  railLit: 0.95,
  slideIn: 20,
  waveSpans: [7, 5, 3.5],
  beats: {
    read: 15,
    rail: 18,
    launch: 29,
    berths: 29,
    wave1: 43,
    wave2: 50,
    wave3: 55,
    resolve: 65,
  },
});

const LIGHT_FRAMES = 4;

const HundredsOfShips: React.FC<HundredsOfShipsProps> = ({
  ink,
  accent,
  shadow,
  hullLength,
  hullBeam,
  stepX,
  stepY,
  blockGap,
  blockGapOpen,
  ruleOffset,
  ruleOverhang,
  capHeight,
  bigScale,
  ghostOpacity,
  litOpacity,
  dimOpacity,
  railDim,
  railLit,
  slideIn,
  waveSpans,
  beats,
}) => {
  const frame = useCurrentFrame();

  const unit = hullPath(hullLength, hullBeam);

  // The resolve opens the three hundreds apart and lets the rules overhang, so
  // the count is readable on the held frame.
  const settle = interpolate(frame, [beats.resolve, beats.resolve + 13], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gap = blockGap + (blockGapOpen - blockGap) * settle;
  const overhang = ruleOverhang * settle;

  const fieldW = (COLS - 1) * stepX + hullLength;
  const blockH = (ROWS - 1) * stepY + hullBeam;
  const totalH = BLOCKS * blockH + (BLOCKS - 1) * gap + ruleOffset;
  const x0 = (CANVAS - fieldW) / 2;
  const y0 = (CANVAS - totalH) / 2;

  const blockY = (b: number) => y0 + b * (blockH + gap);
  const cellX = (c: number) => x0 + c * stepX;
  const cellY = (b: number, r: number) => blockY(b) + r * stepY;

  const waveStart = [beats.wave1, beats.wave2, beats.wave3];
  const blockDone = (b: number) => waveStart[b] + waveSpans[b] + LIGHT_FRAMES;

  // The single hull: dim, then read, then it launches into the first berth.
  const hullIn = interpolate(frame, [-4, 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hullRead = interpolate(frame, [beats.read, beats.read + 6], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const launch = interpolate(frame, [beats.launch, beats.launch + 9], [0, 1], {
    easing: Easing.bezier(0.2, 1.2, 0.35, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bigX = (CANVAS - hullLength * bigScale) / 2;
  const bigY = (CANVAS - hullBeam * bigScale) / 2;
  const leadScale = bigScale + (1 - bigScale) * launch;
  const leadX = bigX + (cellX(0) - bigX) * launch;
  const leadY = bigY + (cellY(0, 0) - bigY) * launch;
  // The lead hull uses the same grammar as the field: an empty berth outline
  // first, filled in once it is read.
  const leadOutline = dimOpacity * hullIn;
  const leadFill = litOpacity * hullRead * hullIn;

  const berths: React.ReactElement[] = [];
  const ships: React.ReactElement[] = [];

  for (let b = 0; b < BLOCKS; b++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const lead = b === 0 && r === 0 && c === 0;
        const x = cellX(c);
        const y = cellY(b, r);

        if (!lead) {
          // Berths materialise on a diagonal, so the field's full extent is
          // legible before a single hundred lands in it.
          const bDelay = beats.berths + ((r + c) / (ROWS + COLS - 2)) * 5 + b * 1.2;
          const bIn = interpolate(frame, [bDelay, bDelay + 4], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (bIn > 0) {
            berths.push(
              <path
                key={`b${b}-${r}-${c}`}
                d={unit}
                transform={`translate(${x} ${y})`}
                fill="none"
                stroke={ink}
                strokeWidth={1.5}
                opacity={ghostOpacity * bIn}
              />,
            );
          }
        }

        // Reading order inside the hundred: the wave wipes it like a line.
        const p = (r * COLS + c) / (ROWS * COLS - 1);
        const delay = waveStart[b] + p * waveSpans[b];
        const wave = interpolate(frame, [delay, delay + LIGHT_FRAMES], [0, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        if (lead) {
          continue;
        }
        if (wave <= 0) {
          continue;
        }
        ships.push(
          <path
            key={`s${b}-${r}-${c}`}
            d={unit}
            transform={`translate(${x - slideIn * (1 - wave)} ${y})`}
            fill={ink}
            opacity={litOpacity * wave}
          />,
        );
      }
    }
  }

  // One rail is drawn under the single hull, then it multiplies into the three
  // ways of the yard — structure first, dim, waiting to be filled.
  const railDraw = interpolate(frame, [beats.rail, beats.rail + 8], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const srcHalf = 150 * railDraw;
  const srcX1 = CANVAS / 2 - srcHalf;
  const srcX2 = CANVAS / 2 + srcHalf;
  const srcY = bigY + hullBeam * bigScale + 16;

  const rails: React.ReactElement[] = [];
  for (let b = 0; b < BLOCKS; b++) {
    const move = interpolate(
      frame,
      [beats.launch + b * 3, beats.launch + b * 3 + 10],
      [0, 1],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );
    if (b > 0 && move <= 0) {
      continue;
    }
    const tX1 = x0 - overhang;
    const tX2 = x0 + fieldW + overhang;
    const tY = blockY(b) + blockH + ruleOffset;
    const x1 = srcX1 + (tX1 - srcX1) * move;
    const x2 = srcX2 + (tX2 - srcX2) * move;
    // Odd stroke on a half-pixel centre, or identical rules antialias differently.
    const y = Math.round(srcY + (tY - srcY) * move) + 0.5;

    const base = b === 0 ? railDim + (0.5 - railDim) * (1 - move) : railDim;
    const opacity = b === 0 ? base * clamp01(railDraw * 4) : base * move;

    const lit = interpolate(frame, [blockDone(b) - 1, blockDone(b) + 4], [0, 1], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    // Each rule ticks up end caps on "of ships", bracketing the hundred above
    // it, so the held frame reads as three measured hundreds.
    const cap =
      capHeight *
      interpolate(frame, [beats.resolve + b * 2, beats.resolve + b * 2 + 9], [0, 1], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    const capX1 = Math.round(x1) + 0.5;
    const capX2 = Math.round(x2) - 0.5;

    rails.push(
      <g key={`r${b}`}>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={accent} strokeWidth={3} opacity={opacity} />
        {lit > 0 ? (
          <line
            x1={x1}
            y1={y}
            x2={x1 + (x2 - x1) * lit}
            y2={y}
            stroke={accent}
            strokeWidth={3}
            opacity={railLit}
          />
        ) : null}
        {cap > 0.5 ? (
          <g stroke={accent} strokeWidth={3} opacity={railLit}>
            <line x1={capX1} y1={y} x2={capX1} y2={y - cap} />
            <line x1={capX2} y1={y} x2={capX2} y2={y - cap} />
          </g>
        ) : null}
      </g>,
    );
  }

  return (
    <AbsoluteFill>
      <svg
        width={CANVAS}
        height={CANVAS}
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
      >
        {berths}
        {rails}
        {ships}
        <g transform={`translate(${leadX} ${leadY}) scale(${leadScale})`}>
          <path
            d={unit}
            fill="none"
            stroke={ink}
            strokeWidth={1.5 / leadScale}
            opacity={leadOutline}
          />
          <path d={unit} fill={ink} opacity={leadFill} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default HundredsOfShips;
