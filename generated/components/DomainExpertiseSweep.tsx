import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 2.620s -> 5.960s of the source cut, ending exactly where the code base
// scene begins.
export const DURATION = 100;

const CX = 540;
const CY = 960;

// A domain read from the outside in: the rim is surface acquaintance, the core
// is mastery. Same "depth means understanding" rule as the later scenes, turned
// radial so it does not repeat them.
const RINGS = 12;
const R_MAX = 420;
const R_MIN = 60;
const ARC = 1.75;

// Peripheral domains, revealed late to make the centre one "a given" domain.
const NEIGHBOURS = [
  {x: 296, y: 318, r: 88},
  {x: 792, y: 352, r: 76},
  {x: 272, y: 1604, r: 82},
  {x: 804, y: 1572, r: 70},
];

// Forces the artwork to the accent colour while keeping its alpha, so a black
// PNG lands as exactly the accent rather than an approximation of it.
const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  const n =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};

const ringRadius = (i: number) => R_MIN + ((R_MAX - R_MIN) * i) / (RINGS - 1);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  litOpacity: z.number().min(0).max(1),
  turns: z.number().min(1).max(6),
  // The mastered core, in public/.
  icon: z.string(),
  iconSize: z.number().min(40).max(200),
  // Beat frames from the SRT at 30fps, relative to 00:00:02.620:
  //   16 "acquiring" · 56 "and expertise" · 72 "in a given" · 86 "domain"
  beats: z.object({
    sweep: z.number().int(),
    sweepEnd: z.number().int(),
    // Rings reached from this frame on resolve in accent, not ink: past here
    // the domain is not merely understood.
    expertise: z.number().int(),
    neighbours: z.number().int(),
    domain: z.number().int(),
  }),
});

export type DomainExpertiseSweepProps = z.infer<typeof schema>;

export const defaultProps: DomainExpertiseSweepProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.13,
  litOpacity: 0.85,
  turns: 3,
  icon: 'openai.png',
  iconSize: 96,
  beats: {sweep: 16, sweepEnd: 74, expertise: 56, neighbours: 72, domain: 86},
});

const DomainExpertiseSweep: React.FC<DomainExpertiseSweepProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  litOpacity,
  turns,
  icon,
  iconSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Constant inward rate: acquisition does not slow down, it just runs out of
  // domain. The rate is what puts the expert radius under "and expertise".
  const p = interpolate(frame, [beats.sweep, beats.sweepEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const front = R_MAX * (1 - p);
  const theta = -Math.PI / 2 + p * turns * Math.PI * 2;

  const core = interpolate(frame, [beats.sweepEnd - 4, beats.sweepEnd + 10], [0, 1], {
    easing: Easing.bezier(0.2, 1.5, 0.4, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const neighbours = interpolate(frame, [beats.neighbours, beats.neighbours + 18], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = interpolate(frame, [beats.domain, beats.domain + 9, beats.domain + 28], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The frame the front reaches a given ring, which is also when it lights.
  const lightFrame = (r: number) =>
    beats.sweep + (beats.sweepEnd - beats.sweep) * (1 - r / R_MAX);

  const arcOut = interpolate(frame, [beats.sweepEnd - 7, beats.sweepEnd + 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const onArc = (r: number, a: number) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  const [tr, tg, tb] = rgbOf(accent);
  const coreSize = Math.max(iconSize * core, 0);
  const [hx, hy] = onArc(front, theta);
  const [tx, ty] = onArc(front, theta - ARC);

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="core-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {NEIGHBOURS.map((n, i) =>
            [0.42, 0.72, 1].map((k, j) => (
              <circle
                key={`n${i}-${j}`}
                cx={n.x}
                cy={n.y}
                r={n.r * k}
                fill="none"
                stroke={ink}
                strokeWidth={2.5}
                opacity={0.15 * neighbours}
              />
            )),
          )}

          {Array.from({length: RINGS}, (_, i) => {
            const r = ringRadius(i);
            const expert = lightFrame(r) >= beats.expertise;
            // Outermost first, so the domain reads as bounded before anything
            // starts working through it.
            const enter = interpolate(
              frame,
              [(RINGS - 1 - i) * 0.9, (RINGS - 1 - i) * 0.9 + 11],
              [0, 1],
              {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              },
            );
            const lit = interpolate(r - front, [0, 26], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const boundary = i === RINGS - 1;
            return (
              <circle
                key={`r${i}`}
                cx={CX}
                cy={CY}
                r={r * (1.05 - 0.05 * enter)}
                fill="none"
                stroke={expert ? accent : ink}
                strokeWidth={boundary ? 5 : 3}
                opacity={(dimOpacity + (litOpacity - dimOpacity) * lit) * enter}
              />
            );
          })}

          {/* "domain": the boundary asserts itself once the inside is known. */}
          <circle
            cx={CX}
            cy={CY}
            r={R_MAX + 26 * pulse}
            fill="none"
            stroke={ink}
            strokeWidth={4}
            opacity={0.55 * pulse}
          />

          {p > 0 ? (
            <g opacity={arcOut}>
              <path
                d={`M${tx.toFixed(2)} ${ty.toFixed(2)} A${front.toFixed(2)} ${front.toFixed(
                  2,
                )} 0 0 1 ${hx.toFixed(2)} ${hy.toFixed(2)}`}
                fill="none"
                stroke={accent}
                strokeWidth={6}
                strokeLinecap="round"
              />
              <circle cx={hx} cy={hy} r={11} fill={accent} />
            </g>
          ) : null}

          {/* Expertise: the centre resolves. */}
          <circle
            cx={CX}
            cy={CY}
            r={(iconSize / 2) * core + 34 * pulse}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            opacity={0.5 * pulse}
          />
        </g>
      </svg>

      {coreSize >= 1 ? (
        <Img
          src={staticFile(icon)}
          style={{
            position: 'absolute',
            left: CX - coreSize / 2,
            top: CY - coreSize / 2,
            width: coreSize,
            height: coreSize,
            filter: `url(#core-tint) drop-shadow(0 2px 6px ${shadow})`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export default DomainExpertiseSweep;
