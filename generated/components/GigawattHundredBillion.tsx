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
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:04.500 -> 00:00:15.019 of the source cut. round((15.019 - 4.500) * 30).
export const DURATION = 316;

// The gigawatt's footprint. One square, three densities.
const SQ = 760;
const SQ_X0 = 160;
const SQ_X1 = SQ_X0 + SQ;
const SQ_Y0 = 620;
const SQ_Y1 = SQ_Y0 + SQ;
const SQ_CX = SQ_X0 + SQ / 2;
const SQ_CY = SQ_Y0 + SQ / 2;

const N1 = 10; //  10 x  10 =        100 workers, drawn as figures
const C1 = SQ / N1;
const N2 = 100; // 100 x 100 =     10,000 workers, drawn as a dot lattice
const C2 = SQ / N2; //             1,000,000 workers is the fused field

// A 10 x 10 grid has no centre cell, so the one worker opens the scene dead
// centre and settles into the nearest one as the population arrives. The
// wavefronts stay concentric with the footprint rather than with his cell —
// half a cell apart, and the circles read as centred.
const OX = SQ_X0 + 5.5 * C1;
const OY = SQ_Y0 + 5.5 * C1;
const MAX_R = Math.hypot(SQ / 2, SQ / 2);
const SOFT = 78; // wavefront feather, in px of radius

const COUNT_Y = 486;
const MONEY_Y_IN = 1246; // under the lone worker, before the footprint exists

const RATE = 100000;
const ICON = staticFile('person.png');

// Three significant figures once we are past four digits, so the odometer reads
// as a number instead of flickering noise. Both endpoints are exact.
const fmt = (n: number) => {
  if (n < 1000) return String(Math.round(n));
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 2);
  return (Math.round(n / mag) * mag).toLocaleString('en-US');
};

const mix = (a: string, b: string, t: number) => {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const c = (i: number) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t);
  return `rgb(${c(1)}, ${c(3)}, ${c(5)})`;
};

// The icon is painted as a colour behind its own alpha, so the same artwork
// serves as both the human and the machine. This deliberately avoids a CSS
// reference to an SVG filter: when Chrome fails to resolve one on a frame the
// element paints as nothing at all, which showed up as whole-field dropouts.
const worker = (color: string): React.CSSProperties => ({
  backgroundColor: color,
  maskImage: `url(${ICON})`,
  WebkitMaskImage: `url(${ICON})`,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
});

const ease = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Digits: React.FC<{
  text: string;
  size: number;
  color: string;
  opacity: number;
  reveal: (i: number) => number;
  shadow: string;
}> = ({text, size, color, opacity, reveal, shadow}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'baseline',
      fontFamily: roboto.fontFamily,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '0.06em',
      marginRight: '-0.06em',
      fontVariantNumeric: 'tabular-nums',
      color,
      opacity,
      filter: `drop-shadow(0 2px 6px ${shadow})`,
    }}
  >
    {text.split('').map((c, i) => {
      const p = reveal(i);
      return (
        <span
          key={`${i}-${c}`}
          style={{opacity: p, transform: `translateY(${(1 - p) * 16}px)`, display: 'inline-block'}}
        >
          {c}
        </span>
      );
    })}
  </div>
);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  numberSize: z.number().min(40).max(120),
  iconScale: z.number().min(0.5).max(1),
  loneSize: z.number().min(120).max(400),
  dotRadius: z.number().min(1).max(3.6),
  packRadius: z.number().min(3).max(5.4),
  fusedRadius: z.number().min(4).max(7),
  fieldAlpha: z.number().min(0).max(1),
  showUnitMarker: z.boolean(),
  // Beat frames from the SRT at 30fps, relative to 00:00:04.500:
  //   0 "white collar" · 41 "know six" · 49 "figures" · 96 "and if you"
  //   110 "have a gigawatt" · 145 "that can" · 167 "population"
  //   179 "of like say a" · 210 "million white" · 233 "collar workers"
  //   284 "that would" · 295 "be 100 billion"
  beats: z.object({
    rate: z.number().int(),
    box: z.number().int(),
    tile: z.number().int(),
    tileEnd: z.number().int(),
    sub: z.number().int(),
    subEnd: z.number().int(),
    dense: z.number().int(),
    denseEnd: z.number().int(),
    resolve: z.number().int(),
    total: z.number().int(),
  }),
});

export type GigawattHundredBillionProps = z.infer<typeof schema>;

export const defaultProps: GigawattHundredBillionProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  numberSize: 62,
  iconScale: 0.86,
  loneSize: 272,
  dotRadius: 2.6,
  packRadius: 4.7,
  fusedRadius: 5.2,
  fieldAlpha: 0.95,
  showUnitMarker: true,
  beats: {
    rate: 41,
    box: 110,
    tile: 145,
    tileEnd: 185,
    sub: 192,
    subEnd: 236,
    dense: 228,
    denseEnd: 272,
    resolve: 284,
    total: 304,
  },
});

const GigawattHundredBillion: React.FC<GigawattHundredBillionProps> = ({
  ink,
  accent,
  shadow,
  numberSize,
  iconScale,
  loneSize,
  dotRadius,
  packRadius,
  fusedRadius,
  fieldAlpha,
  showUnitMarker,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Three wavefronts, each chasing the last outward from the one worker.
  const R1 = interpolate(frame, [beats.tile, beats.tileEnd], [0, MAX_R + SOFT], ease);
  const R2 = interpolate(frame, [beats.sub, beats.subEnd], [0, MAX_R + SOFT], ease);
  const R3 = interpolate(frame, [beats.dense, beats.denseEnd], [0, MAX_R + SOFT], ease);

  const resolve = interpolate(frame, [beats.resolve, beats.total], [0, 1], ease);

  // Starts part-way in so frame 0 is never empty.
  const lone = interpolate(frame, [-5, 9], [0, 1], out);
  const boxP = interpolate(frame, [beats.box, beats.box + 15], [0, 1], out);
  const countP = interpolate(frame, [beats.tile - 6, beats.tile + 10], [0, 1], out);
  const markerP = showUnitMarker ? interpolate(frame, [beats.sub + 8, beats.sub + 26], [0, 1], out) : 0;
  const specked = interpolate(frame, [beats.sub, beats.sub + 14], [0, 1], ease);

  const loneS = interpolate(
    frame,
    [beats.tile, beats.tile + 16, beats.sub, beats.sub + 14],
    [loneSize, C1 * iconScale, C1 * iconScale, C2],
    ease,
  );
  // Centre of frame to begin with; takes his place in the grid as it fills.
  const settle = interpolate(frame, [beats.tile - 8, beats.tile + 14], [0, 1], ease);
  const lx = SQ_CX + (OX - SQ_CX) * settle;
  const ly = SQ_CY + (OY - SQ_CY) * settle;

  // Both numbers sit the same distance off the footprint, at the same size.
  const moneyYOut = SQ_Y1 + (SQ_Y0 - (COUNT_Y + numberSize));
  // Steps aside ahead of the footprint, so the two never cross.
  const moneyY = interpolate(frame, [beats.box - 14, beats.box + 4], [MONEY_Y_IN, moneyYOut], ease);

  // The population is read off the field itself: how much of the square is
  // standing at which density right now. It cannot drift from what is drawn.
  const K = 80;
  let counted = 0;
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      const d = Math.hypot(SQ_X0 + (i + 0.5) * (SQ / K) - SQ_CX, SQ_Y0 + (j + 0.5) * (SQ / K) - SQ_CY);
      if (d <= R3) counted += 1000000;
      else if (d <= R2) counted += 10000;
      else if (d <= R1) counted += 100;
    }
  }
  const population = Math.max(1, counted / (K * K));
  const money = RATE * Math.pow(1000000, resolve);

  const moneyStr = `$${fmt(money)}`;
  const moneyColor = mix(ink, accent, resolve);

  // The last stage is the same lattice packed until it fuses, not a fill: the
  // field saturates on the frame the total lands.
  const packR = interpolate(
    frame,
    [beats.dense, beats.denseEnd, beats.resolve, beats.total],
    [dotRadius + 0.4, packRadius, packRadius, fusedRadius],
    ease,
  );

  // Everything outside the dot wavefront is still drawn as figures.
  const glyphMask = `radial-gradient(circle at ${SQ / 2}px ${SQ / 2}px, transparent 0px, transparent ${R2}px, #000 ${R2}px)`;

  return (
    <AbsoluteFill>
      {/* Gates every frame on the icon being loaded. */}
      <Img src={ICON} style={{position: 'absolute', width: 1, height: 1, opacity: 0}} />

      <div style={{position: 'absolute', top: COUNT_Y, left: 0, right: 0}}>
        <Digits
          text={fmt(population)}
          size={numberSize}
          color={ink}
          opacity={countP * (0.88 - 0.62 * resolve)}
          reveal={() => 1}
          shadow={shadow}
        />
      </div>

      <div style={{position: 'absolute', top: moneyY, left: 0, right: 0}}>
        <Digits
          text={moneyStr}
          size={numberSize}
          color={moneyColor}
          opacity={1}
          // "six figures": the digits arrive one at a time, and the number is
          // never abbreviated, so its width is the second reading of its size.
          reveal={(i) =>
            interpolate(frame, [beats.rate + i * 2, beats.rate + i * 2 + 9], [0, 1], out)
          }
          shadow={shadow}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: SQ_X0,
          top: SQ_Y0,
          width: SQ,
          height: SQ,
          overflow: 'hidden',
          maskImage: glyphMask,
          WebkitMaskImage: glyphMask,
          filter: `drop-shadow(0 2px 6px ${shadow})`,
        }}
      >
        {Array.from({length: N1 * N1}, (_, k) => {
          const i = k % N1;
          const j = Math.floor(k / N1);
          if (i === 5 && j === 5) return null; // the human keeps his cell
          const cx = SQ_X0 + (i + 0.5) * C1;
          const cy = SQ_Y0 + (j + 0.5) * C1;
          const d = Math.hypot(cx - SQ_CX, cy - SQ_CY);
          const p = interpolate(R1 - d, [0, SOFT], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const base = C1 * iconScale;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: cx - SQ_X0 - base / 2,
                top: cy - SQ_Y0 - base / 2,
                width: base,
                height: base,
                transform: `scale(${p * (1 + 0.16 * Math.sin(Math.PI * p))})`,
                opacity: 0.88 * p,
                ...worker(accent),
              }}
            />
          );
        })}
      </div>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id="gw-sq">
            <rect x={SQ_X0} y={SQ_Y0} width={SQ} height={SQ} />
          </clipPath>
          <mask id="gw-dots" maskUnits="userSpaceOnUse" x={SQ_X0} y={SQ_Y0} width={SQ} height={SQ}>
            <circle cx={SQ_CX} cy={SQ_CY} r={R2} fill="#fff" />
            <circle cx={SQ_CX} cy={SQ_CY} r={R3} fill="#000" />
          </mask>
          <mask id="gw-solid" maskUnits="userSpaceOnUse" x={SQ_X0} y={SQ_Y0} width={SQ} height={SQ}>
            <circle cx={SQ_CX} cy={SQ_CY} r={R3} fill="#fff" />
          </mask>
          <pattern id="gw-lattice" x={SQ_X0} y={SQ_Y0} width={C2} height={C2} patternUnits="userSpaceOnUse">
            <circle cx={C2 / 2} cy={C2 / 2} r={dotRadius} fill={accent} />
          </pattern>
          <pattern id="gw-packed" x={SQ_X0} y={SQ_Y0} width={C2} height={C2} patternUnits="userSpaceOnUse">
            <circle cx={C2 / 2} cy={C2 / 2} r={packR} fill={accent} />
          </pattern>
        </defs>

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          <g clipPath="url(#gw-sq)">
            <rect
              x={SQ_X0}
              y={SQ_Y0}
              width={SQ}
              height={SQ}
              fill="url(#gw-lattice)"
              mask="url(#gw-dots)"
              opacity={fieldAlpha}
            />
            <rect
              x={SQ_X0}
              y={SQ_Y0}
              width={SQ}
              height={SQ}
              fill="url(#gw-packed)"
              mask="url(#gw-solid)"
              opacity={fieldAlpha}
            />
          </g>

          {/* The footprint itself, opening from the top edge in both directions. */}
          <g
            fill="none"
            stroke={accent}
            strokeWidth={4}
            strokeLinecap="square"
            strokeDasharray={2 * SQ}
            strokeDashoffset={2 * SQ * (1 - boxP)}
            opacity={boxP > 0 ? 0.92 : 0}
          >
            <path d={`M${SQ_CX} ${SQ_Y0} L${SQ_X1} ${SQ_Y0} L${SQ_X1} ${SQ_Y1} L${SQ_CX} ${SQ_Y1}`} />
            <path d={`M${SQ_CX} ${SQ_Y0} L${SQ_X0} ${SQ_Y0} L${SQ_X0} ${SQ_Y1} L${SQ_CX} ${SQ_Y1}`} />
          </g>

          {/* The one worker, once he is too small to be a figure. */}
          <rect
            x={OX - C2 / 2}
            y={OY - C2 / 2}
            width={C2}
            height={C2}
            fill={ink}
            opacity={0.98 * specked}
          />

          {markerP > 0 ? (
            <g stroke={ink} strokeWidth={3} fill="none" opacity={0.5 * markerP} strokeLinecap="round">
              {[
                [-1, -1],
                [1, -1],
                [-1, 1],
                [1, 1],
              ].map(([sx, sy], i) => (
                <path
                  key={i}
                  d={`M${OX + sx * 34 - sx * 16} ${OY + sy * 34} L${OX + sx * 34} ${OY + sy * 34} L${
                    OX + sx * 34
                  } ${OY + sy * 34 - sy * 16}`}
                />
              ))}
            </g>
          ) : null}
        </g>
      </svg>

      {/* One worker, kept on top of the field so he is never buried: the scale
          reference for everything the gigawatt sustains. He is painted and
          masked from frame 0, which is also what forces the icon to decode
          before any grid cell needs it. */}
      <div
        style={{
          position: 'absolute',
          left: lx - (loneS * (0.9 + 0.1 * lone)) / 2,
          top: ly - (loneS * (0.9 + 0.1 * lone)) / 2,
          width: loneS * (0.9 + 0.1 * lone),
          height: loneS * (0.9 + 0.1 * lone),
          opacity: 0.94 * lone * (1 - specked),
          filter: `drop-shadow(0 2px 6px ${shadow})`,
          ...worker(ink),
        }}
      />
    </AbsoluteFill>
  );
};

export default GigawattHundredBillion;
