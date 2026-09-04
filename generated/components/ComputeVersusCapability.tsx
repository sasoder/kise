import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
// 00:00:01.060 -> 00:00:06.419 of the source cut: round((6.419 - 1.060) * 24).
export const DURATION = 129;

// Capability is measured up from the compute floor, so the two quantities
// share one vertical scale and the shortfall is the literal empty space.
const BASE_Y = 1560;
const CAP_SPAN = 1000;
const HEADROOM = 130; // how far the fullest tower stops short of its own cap

const TOWER_W = 300;
const LEFT_CX = 290;
const RIGHT_CX = 790;

const CAP_W = 348;
const CAP_H = 15;
const SLOT_GAP = 9;

// Both flags are drawn into one 300x200 box so the two read as a matched pair
// rather than at their real, different aspect ratios.
const FLAG_VB_W = 300;
const FLAG_VB_H = 200;
const FLAG_GAP = 52;
const FLAG_RADIUS = 10;

const US_RED = '#B22234';
const US_BLUE = '#3C3B6E';
const CN_RED = '#EE1C25';
const CN_GOLD = '#FFDE00';

// Regular pentagram; 0.382 is the inner/outer radius of a five-pointed star.
const starPath = (cx: number, cy: number, r: number, rotDeg: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const o = ((rotDeg + i * 72) * Math.PI) / 180;
    const n = ((rotDeg + 36 + i * 72) * Math.PI) / 180;
    pts.push(`${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(o)).toFixed(2)} ${(cy + r * Math.sin(o)).toFixed(2)}`);
    pts.push(`L${(cx + r * 0.382 * Math.cos(n)).toFixed(2)} ${(cy + r * 0.382 * Math.sin(n)).toFixed(2)}`);
  }
  return `${pts.join(' ')} Z`;
};

const UsFlag: React.FC = () => {
  const stripe = FLAG_VB_H / 13;
  const cantonW = 120;
  const cantonH = stripe * 7;
  const stars: React.ReactNode[] = [];
  for (let row = 0; row < 9; row++) {
    const six = row % 2 === 0;
    const cols = six ? 6 : 5;
    for (let col = 0; col < cols; col++) {
      const cx = (cantonW * (col + (six ? 1 : 1.5))) / 7;
      const cy = (cantonH * (row + 1)) / 10;
      stars.push(<path key={`${row}-${col}`} d={starPath(cx, cy, 5, -90)} fill="#FFFFFF" />);
    }
  }
  return (
    <g>
      <rect x={0} y={0} width={FLAG_VB_W} height={FLAG_VB_H} fill="#FFFFFF" />
      {Array.from({length: 7}, (_, i) => (
        <rect key={i} x={0} y={i * 2 * stripe} width={FLAG_VB_W} height={stripe} fill={US_RED} />
      ))}
      <rect x={0} y={0} width={cantonW} height={cantonH} fill={US_BLUE} />
      {stars}
    </g>
  );
};

const CnFlag: React.FC = () => {
  // The PRC's own 30x20 construction grid, scaled by 10.
  const small: [number, number][] = [
    [100, 20],
    [120, 40],
    [120, 70],
    [100, 90],
  ];
  return (
    <g>
      <rect x={0} y={0} width={FLAG_VB_W} height={FLAG_VB_H} fill={CN_RED} />
      <path d={starPath(50, 50, 30, -90)} fill={CN_GOLD} />
      {small.map(([cx, cy], i) => (
        <path
          key={i}
          d={starPath(cx, cy, 10, (Math.atan2(50 - cy, 50 - cx) * 180) / Math.PI)}
          fill={CN_GOLD}
        />
      ))}
    </g>
  );
};

const capY = (v: number) => BASE_Y - v * CAP_SPAN;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  unknownOpacity: z.number().min(0).max(1),
  litOpacity: z.number().min(0).max(1),
  axisOpacity: z.number().min(0).max(1),
  // Perceived model capability, as a fraction of the shared scale. The point of
  // the scene is that these two are nearly the same number.
  capLeft: z.number().min(0.2).max(1),
  capRight: z.number().min(0.2).max(1),
  // Compute, in ladder units. The ladder is the same height on both sides, so
  // the unfilled slots on the right read as absence rather than as blank canvas.
  leftUnits: z.number().int().min(2).max(40),
  rightUnits: z.number().int().min(1).max(40),
  flagWidth: z.number().min(80).max(340),
  // Beat frames from the SRT at 24fps, relative to 00:00:01.060:
  //   0 "not that" · 10 "far behind" · 23 "in ai models" · 59 "by the public"
  //   77 "relative to the" · 96 "amount of" · 107 "compute" · 123 "right?"
  beats: z.object({
    capL: z.number().int(),
    capR: z.number().int(),
    level: z.number().int(),
    levelEnd: z.number().int(),
    ground: z.number().int(),
    stack: z.number().int(),
    stackEnd: z.number().int(),
  }),
});

export type ComputeVersusCapabilityProps = z.infer<typeof schema>;

export const defaultProps: ComputeVersusCapabilityProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  unknownOpacity: 0.1,
  litOpacity: 0.86,
  axisOpacity: 0.22,
  capLeft: 1,
  capRight: 0.944,
  leftUnits: 18,
  rightUnits: 2,
  flagWidth: 176,
  beats: {capL: 0, capR: 10, level: 23, levelEnd: 59, ground: 77, stack: 96, stackEnd: 123},
});

const ease = (
  frame: number,
  range: [number, number],
  easing: (n: number) => number,
): number =>
  interpolate(frame, range, [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const ComputeVersusCapability: React.FC<ComputeVersusCapabilityProps> = ({
  ink,
  accent,
  shadow,
  unknownOpacity,
  litOpacity,
  axisOpacity,
  capLeft,
  capRight,
  leftUnits,
  rightUnits,
  flagWidth,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // One ladder shared by both towers: pitched so the fuller tower tops out
  // exactly HEADROOM below the cap it is reaching for.
  const pitch = (BASE_Y - capY(capLeft) - HEADROOM) / leftUnits;
  const blockH = pitch - SLOT_GAP;

  const yL = Math.round(capY(capLeft)) + 0.5;
  const yR = capY(capRight);
  const groundY = Math.round(BASE_Y) + 0.5;

  // Anticipated by four frames so frame 0 already carries the graphic.
  const capLIn = ease(frame, [beats.capL - 4, beats.capL + 7], Easing.bezier(0.2, 1.5, 0.4, 1));
  const capRIn = ease(frame, [beats.capR - 4, beats.capR + 7], Easing.bezier(0.2, 1.5, 0.4, 1));
  const capLLand = interpolate(frame, [beats.capL + 2, beats.capL + 9, beats.capL + 22], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const capRLand = interpolate(frame, [beats.capR + 2, beats.capR + 9, beats.capR + 22], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Reaches across slowly, so the long hold on "at least perceivably by the
  // public" is spent measuring rather than sitting still.
  const level = ease(frame, [beats.level, beats.levelEnd], Easing.inOut(Easing.cubic));
  const delta = ease(frame, [beats.levelEnd - 10, beats.levelEnd + 3], Easing.out(Easing.cubic));

  // The capability comparison is made; it steps back so the compute field can
  // exist underneath it, then comes back up for the resolve.
  const recede = ease(frame, [beats.ground - 4, beats.ground + 16], Easing.inOut(Easing.cubic));
  const restore = ease(frame, [beats.stackEnd - 6, beats.stackEnd + 4], Easing.out(Easing.cubic));
  const capOpacity = 1 - 0.5 * recede * (1 - restore);

  const flagL = ease(frame, [beats.capL - 6, beats.capL + 9], Easing.out(Easing.cubic));
  const flagR = ease(frame, [beats.capL - 2, beats.capL + 13], Easing.out(Easing.cubic));
  // Recedes less than the caps do — it is an identity label, not a measurement.
  const flagOpacity = 1 - 0.28 * recede * (1 - restore);

  const ground = ease(frame, [beats.ground, beats.ground + 15], Easing.out(Easing.cubic));
  const ghost = ease(frame, [beats.ground + 6, beats.ground + 20], Easing.out(Easing.quad));

  // Wavefronts, in ladder units. The taller tower is also the slower draw, so
  // the quantity is encoded twice.
  const riseL = interpolate(frame, [beats.stack, beats.stackEnd], [0, leftUnits], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const riseR = interpolate(frame, [beats.stack + 2, beats.stack + 12], [0, rightUnits], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const flagScale = flagWidth / FLAG_VB_W;
  const flagH = FLAG_VB_H * flagScale;

  const Flag: React.FC<{id: string; cx: number; p: number; children: React.ReactNode}> = ({
    id,
    cx,
    p,
    children,
  }) => {
    const x = cx - flagWidth / 2;
    const y = yL - CAP_H / 2 - FLAG_GAP - flagH + (1 - p) * 18;
    return (
      <g opacity={p * flagOpacity}>
        <defs>
          <clipPath id={id}>
            <rect
              x={0}
              y={0}
              width={FLAG_VB_W}
              height={FLAG_VB_H}
              rx={FLAG_RADIUS}
              ry={FLAG_RADIUS}
            />
          </clipPath>
        </defs>
        <g transform={`translate(${x} ${y}) scale(${flagScale})`}>
          <g clipPath={`url(#${id})`}>{children}</g>
        </g>
      </g>
    );
  };

  const Cap: React.FC<{cx: number; y: number; p: number; land: number}> = ({cx, y, p, land}) => (
    <g
      transform={`translate(${cx} ${y}) scale(${p} 1) translate(${-cx} ${-y})`}
      opacity={p > 0 ? capOpacity : 0}
    >
      <rect
        x={cx - (CAP_W / 2) * (1 + 0.09 * land)}
        y={y - CAP_H / 2 - 5 * land}
        width={CAP_W * (1 + 0.09 * land)}
        height={CAP_H + 10 * land}
        rx={(CAP_H + 10 * land) / 2}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        opacity={0.5 * land}
      />
      <rect
        x={cx - CAP_W / 2}
        y={y - CAP_H / 2}
        width={CAP_W}
        height={CAP_H}
        rx={CAP_H / 2}
        fill={accent}
      />
    </g>
  );

  // Both towers get the full ladder. Only the fill differs.
  const Tower: React.FC<{cx: number; rise: number}> = ({cx, rise}) => (
    <g>
      {Array.from({length: leftUnits}, (_, i) => {
        const slotTop = BASE_Y - (i + 1) * pitch;
        const p = Math.min(Math.max(rise - i, 0), 1);
        return (
          <g key={i}>
            <rect
              x={cx - TOWER_W / 2 + 1}
              y={slotTop + 1}
              width={TOWER_W - 2}
              height={blockH - 2}
              rx={6}
              fill="none"
              stroke={ink}
              strokeWidth={2}
              opacity={unknownOpacity * 1.8 * ghost * (1 - 0.55 * p)}
            />
            {p > 0 ? (
              <rect
                x={cx - TOWER_W / 2}
                y={slotTop + blockH * (1 - p)}
                width={TOWER_W}
                height={blockH * p}
                rx={6}
                fill={ink}
                opacity={litOpacity}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* "relative to the amount of compute they have" — the floor both
              towers are measured from. */}
          <line
            x1={540 - 444 * ground}
            y1={groundY}
            x2={540 + 444 * ground}
            y2={groundY}
            stroke={ink}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={axisOpacity * ground}
          />

          <Tower cx={LEFT_CX} rise={riseL} />
          <Tower cx={RIGHT_CX} rise={riseR} />

          {/* "not that far behind" — the higher cap's level carried across to
              the lower one. The leftover is the whole claim. */}
          <line
            x1={LEFT_CX + CAP_W / 2}
            y1={yL}
            x2={LEFT_CX + CAP_W / 2 + (RIGHT_CX + CAP_W / 2 - LEFT_CX - CAP_W / 2) * level}
            y2={yL}
            stroke={accent}
            strokeWidth={3}
            strokeDasharray="14 12"
            strokeLinecap="round"
            opacity={(0.62 - 0.42 * recede) * (level > 0 ? 1 : 0)}
          />
          <rect
            x={RIGHT_CX - 6}
            y={yL}
            width={12}
            height={Math.max((yR - yL) * delta, 0)}
            rx={6}
            fill={accent}
            opacity={(0.85 - 0.5 * recede) * (delta > 0 ? 1 : 0)}
          />

          <Cap cx={LEFT_CX} y={yL} p={capLIn} land={capLLand} />
          <Cap cx={RIGHT_CX} y={yR} p={capRIn} land={capRLand} />

          <Flag id="cvc-flag-us" cx={LEFT_CX} p={flagL}>
            <UsFlag />
          </Flag>
          <Flag id="cvc-flag-cn" cx={RIGHT_CX} p={flagR}>
            <CnFlag />
          </Flag>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ComputeVersusCapability;
