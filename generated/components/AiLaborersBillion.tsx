import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:19.739 -> 00:00:27.920 of the source cut: "...where open ai goes from
// having say 10 million basically ai laborers this year, to 100 million the
// next year, to a billion the year after that".
export const DURATION = 245;

const W = 1080;
const H = 1920;
const CX = 540;
// The centre the previous clip resolved on, so this container arrives around
// the shape that graphic left behind.
const CY = 1000;

// One dot is ten million people, and the lattice is the world: 25 x 32 = 800
// dots = eight billion. The previous clip already spent "a field multiplies by
// ten"; what is new here are absolute numbers, and an absolute number only
// means something against a ruler. So the ruler is the whole graphic.
//
// The unit is chosen so the three years he names are countable rather than
// read: one dot, ten dots, a hundred dots. A hundred of eight hundred is
// exactly an eighth of the field — which is the headroom the next line
// ("more labor equivalents than there are people on earth") needs to burst.
const COLS = 25;
const ROWS = 32;
const PITCH = 30;
const FIELD_W = COLS * PITCH; // 750
const FIELD_H = ROWS * PITCH; // 960
const X0 = CX - FIELD_W / 2; // 165
const X1 = X0 + FIELD_W; // 915
const Y0 = CY - FIELD_H / 2; // 520
const Y1 = CY + FIELD_H / 2; // 1480, the floor

// Dots lit after each of the three years.
const YEARS = [1, 10, 100];
// Frames each year takes to arrive. The counts jump 1 -> 9 -> 90 while the
// durations barely move, so the rate itself is the acceleration: 0.07, 0.64,
// 3.75 dots per frame.
const DURS = [14, 14, 24];
// Width of the lighting wavefront, in dots. A single dot has no wavefront; a
// hundred arrive as a surge.
const RAMPS = [0.9, 1.6, 14];

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

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

// A lit dot is a shade larger than an unknown one. The count carries the
// quantity, not the dot, so this costs nothing and keeps a single lit cell
// legible against the eight hundred it sits in.
const LIT = 1.15;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Half-pixel edges with an odd stroke, or identical rules antialias anywhere
// between 4% and 13% alpha and the field shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

type Cell = {x: number; y: number; d: number; p1: number; p2: number};

// Built once at module scope: the lattice is fixed, only the read of it moves.
// Index order is fill order — rows from the floor up, and within a row cells
// alternate outward from the centre column, so a part-filled row is a centred
// mesa rather than a stub in a corner. COLS is odd, so the very first dot —
// this year's entire ten million — lands dead centre.
const CELLS: Cell[] = [];
{
  const half = Math.hypot(FIELD_W, FIELD_H) / 2;
  for (let row = 0; row < ROWS; row++) {
    const y = Y1 - (row + 0.5) * PITCH;
    for (let s = 0; s < COLS; s++) {
      const col = (COLS - 1) / 2 + Math.ceil(s / 2) * (s % 2 === 1 ? 1 : -1);
      const x = X0 + (col + 0.5) * PITCH;
      const i = CELLS.length;
      CELLS.push({
        x,
        y,
        d: Math.hypot(x - CX, y - CY) / half,
        p1: hash(i, 1) * Math.PI * 2,
        p2: hash(i, 11) * Math.PI * 2,
      });
    }
  }
}

// The boundary of the filled region as one polyline: complete rows run the full
// width, the row in progress is a centred plateau. Both edges are read off the
// cells that are actually lit rather than off a float count, so the line can
// never bracket a dot it is not counting — an even number of cells cannot sit
// symmetrically about an odd lattice, and half a cell of drift is exactly the
// error that stops the line reading as a count. The cost is that the level
// advances a cell at a time, which at these rates is the counting itself.
//
// The arms are omitted until a row is actually complete; otherwise ten million
// would draw a full-width accent rule along the floor and overstate itself by
// two orders of magnitude.
const levelPath = (lit: number) => {
  const rowsDone = Math.floor(lit / COLS);
  const k = lit - rowsDone * COLS;
  const yMid = snap(Y1 - rowsDone * PITCH);
  const yTop = snap(Y1 - (rowsDone + 1) * PITCH);
  // The first k cells of the alternating centre-out sequence span these columns.
  const c0 = (COLS - 1) / 2;
  const xL = snap(X0 + (c0 - Math.floor((k - 1) / 2)) * PITCH);
  const xR = snap(X0 + (c0 + Math.floor(k / 2) + 1) * PITCH);
  const parts: string[] = [];
  if (rowsDone >= 1) {
    parts.push(`M ${snap(X0)} ${yMid} L ${k > 0 ? xL : snap(X1)} ${yMid}`);
    if (k > 0) parts.push(`M ${xR} ${yMid} L ${snap(X1)} ${yMid}`);
  }
  if (k > 0) {
    parts.push(`M ${xL} ${yMid} L ${xL} ${yTop} L ${xR} ${yTop} L ${xR} ${yMid}`);
  }
  return parts.join(' ');
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // The world sits in the unknown state the whole clip. It is a bounded
  // quantity, deliberately never explained here — the next line explains it.
  fieldOpacity: z.number().min(0).max(1),
  boundsOpacity: z.number().min(0).max(1),
  dotOpacity: z.number().min(0).max(1),
  levelOpacity: z.number().min(0).max(1),
  // The year being spoken reads; the years already spent recede to context.
  yearOpacity: z.number().min(0).max(1),
  yearPastOpacity: z.number().min(0).max(1),
  yearSize: z.number().min(20).max(120),
  yearGap: z.number().min(120).max(400),
  years: z.array(z.string()),
  strokeWidth: z.number().min(1).max(9),
  levelWidth: z.number().min(1).max(9),
  driftAmp: z.number().min(0).max(20),
  // '' to drop the mark entirely.
  icon: z.string(),
  logoSize: z.number().min(40).max(240),
  logoTop: z.number().min(0).max(600),
  logoOpacity: z.number().min(0).max(1),
  // Beat frames from the SRT at 30fps, relative to 00:00:19.739:
  //   0 "where open" · 20 "ai goes from" · 41 "having say" · 64 "10 million"
  //   94 "basically" · 103 "ai laborers" · 130 "this year"
  //   143 "to 100 million" · 172 "the next" · 180 "year to a"
  //   204 "billion" · 213 "the year" · 224 "after that"
  beats: z.object({
    field: z.number().int(),
    step1: z.number().int(),
    year1: z.number().int(),
    step2: z.number().int(),
    year2: z.number().int(),
    step3: z.number().int(),
    year3: z.number().int(),
  }),
});

export type AiLaborersBillionProps = z.infer<typeof schema>;

export const defaultProps: AiLaborersBillionProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  fieldOpacity: 0.16,
  boundsOpacity: 0.3,
  dotOpacity: 0.92,
  levelOpacity: 0.9,
  yearOpacity: 0.9,
  yearPastOpacity: 0.4,
  yearSize: 58,
  yearGap: 250,
  years: ['2027', '2028', '2029'],
  strokeWidth: 3,
  levelWidth: 5,
  driftAmp: 1.6,
  icon: 'openai-logo.png',
  // Continuous with the previous clip, which resolved with the mark pinned at
  // this exact size, position and opacity.
  logoSize: 118,
  logoTop: 150,
  logoOpacity: 0.82,
  // step3 is pulled ahead of the word so the surge is 87% resolved on
  // "billion" at 204 rather than starting there.
  beats: {field: 0, step1: 64, year1: 130, step2: 143, year2: 180, step3: 192, year3: 214},
});

const AiLaborersBillion: React.FC<AiLaborersBillionProps> = ({
  ink,
  accent,
  shadow,
  fieldOpacity,
  boundsOpacity,
  dotOpacity,
  levelOpacity,
  yearOpacity,
  yearPastOpacity,
  yearSize,
  yearGap,
  years,
  strokeWidth,
  levelWidth,
  driftAmp,
  icon,
  logoSize,
  logoTop,
  logoOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const [tr, tg, tb] = rgbOf(accent);
  const steps = [beats.step1, beats.step2, beats.step3];

  // A breath in before each year, so the jump has somewhere to come from.
  let pre = 1;
  for (const s of steps) {
    pre *= interpolate(frame, [s - 6, s - 1, s + 4], [1, 0.982, 1], {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // The live count. `from` is what the previous year already established and
  // stays lit unconditionally, so a wider wavefront on a later year can never
  // dim a dot that has already been counted.
  let from = 0;
  let to = 0;
  let ramp = RAMPS[0];
  let t = 0;
  for (let k = 0; k < steps.length; k++) {
    if (frame >= steps[k]) {
      from = k === 0 ? 0 : YEARS[k - 1];
      to = YEARS[k];
      ramp = RAMPS[k];
      t = interpolate(frame, [steps[k], steps[k] + DURS[k]], [0, 1], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }
  // The wavefront overshoots by exactly one ramp so the last dot of a year is
  // fully lit when the count lands on it.
  const wf = from + (to + ramp - from) * t;

  // The container is drawn on once and then left alone.
  const bounds = interpolate(frame, [beats.field, beats.field + 22], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const levelIn = interpolate(frame, [beats.step1, beats.step1 + 8], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // One dot in eight hundred is nearly nothing to look at, which is the point —
  // but it has to be seen before it is dwarfed, so the first year gets a ring
  // of its own and nothing else does.
  const pop = interpolate(frame, [beats.step1, beats.step1 + 10, beats.step1 + 30], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ring = interpolate(frame, [beats.step1, beats.step1 + 30], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Cells that have arrived far enough to be counted. The level line is drawn
  // from this, so the two cannot drift apart when the clip is retimed.
  let lit = 0;
  for (let i = 0; i < to; i++) {
    if (i < from || clamp01((wf - i) / ramp) >= 0.5) lit = i + 1;
  }

  const perim = 2 * (FIELD_W + FIELD_H);
  const ticks = [beats.year1, beats.year2, beats.year3];
  const r0 = PITCH * 0.187;

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="lab-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
      >
        <g transform={`translate(${CX} ${CY}) scale(${pre}) translate(${-CX} ${-CY})`}>
          {/* The world, in the unknown state: eight billion people as a bounded
              lattice that materialises from the centre out and is then simply
              there, unexplained, for the whole clip. */}
          {CELLS.map((c, i) => {
            const a = clamp01((frame - (beats.field + 6) - c.d * 16) / 12);
            if (a <= 0) return null;
            return (
              <circle
                key={`w${i}`}
                cx={c.x}
                cy={c.y}
                r={r0}
                fill={ink}
                opacity={fieldOpacity * a}
              />
            );
          })}

          <rect
            x={snap(X0)}
            y={snap(Y0)}
            width={FIELD_W}
            height={FIELD_H}
            rx={10}
            fill="none"
            stroke={ink}
            strokeWidth={strokeWidth}
            strokeDasharray={perim}
            strokeDashoffset={perim * (1 - bounds)}
            opacity={boundsOpacity * bounds}
          />

          {/* The AI labour, in the accent: the same lattice cells, counted. */}
          {CELLS.slice(0, to).map((c, i) => {
            const appear = i < from ? 1 : clamp01((wf - i) / ramp);
            if (appear <= 0) return null;
            const eased = 1 - Math.pow(1 - appear, 3);
            const crest = clamp01(1 - Math.abs(wf - i) / (ramp * 1.6));
            const amp = driftAmp * eased;
            const dx = Math.sin(frame * 0.055 + c.p1) * amp;
            const dy = Math.sin(frame * 0.043 + c.p2) * amp * 0.8;
            const solo = i === 0 ? pop * 1.05 : 0;
            return (
              <circle
                key={`a${i}`}
                cx={c.x + dx}
                cy={c.y + dy}
                r={r0 * LIT * eased * (1 + crest * 0.2 + solo)}
                fill={accent}
                opacity={Math.min(1, dotOpacity * eased)}
              />
            );
          })}

          {ring > 0 && ring < 1 ? (
            <circle
              cx={CELLS[0].x}
              cy={CELLS[0].y}
              r={12 + ring * 66}
              fill="none"
              stroke={accent}
              strokeWidth={strokeWidth}
              opacity={(1 - ring) * 0.85}
            />
          ) : null}

          {/* The level. Its height is complete rows and its width is the row in
              progress, so each year is encoded twice: more dots, and a line
              that runs further and stands higher. */}
          {lit > 0 ? (
            <path
              d={levelPath(lit)}
              fill="none"
              stroke={accent}
              strokeWidth={levelWidth}
              strokeLinecap="butt"
              opacity={levelOpacity * levelIn}
            />
          ) : null}

        </g>
      </svg>

      {/* Three years, named under the container as he reaches them. Each one
          reads on its word and then recedes when the next arrives, so the last
          frame carries the year the billion lands in. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${pre})`,
          transformOrigin: `${CX}px ${CY}px`,
          filter: `drop-shadow(0 2px 6px ${shadow})`,
        }}
      >
        {ticks.map((tf, k) => {
          const a = interpolate(frame, [tf, tf + 9], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (a <= 0 || years[k] === undefined) return null;
          const next = ticks[k + 1];
          const recede =
            next === undefined
              ? 0
              : interpolate(frame, [next, next + 10], [0, 1], {
                  easing: Easing.out(Easing.cubic),
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
          return (
            <div
              key={years[k]}
              style={{
                position: 'absolute',
                left: CX + (k - 1) * yearGap,
                top: Y1 + 44 + (1 - a) * 12,
                // The negative margin cancels the trailing letterSpacing, so
                // translateX centres the glyphs rather than the tracking.
                transform: 'translateX(-50%)',
                opacity: (yearOpacity + (yearPastOpacity - yearOpacity) * recede) * a,
              }}
            >
              <span
                style={{
                  fontFamily: roboto.fontFamily,
                  fontWeight: 700,
                  fontSize: yearSize,
                  lineHeight: 1,
                  letterSpacing: '0.11em',
                  marginRight: '-0.11em',
                  whiteSpace: 'nowrap',
                  color: ink,
                  display: 'inline-block',
                }}
              >
                {years[k]}
              </span>
            </div>
          );
        })}
      </div>

      {icon === '' ? null : (
        <Img
          src={staticFile(icon)}
          style={{
            position: 'absolute',
            left: CX - logoSize / 2,
            top: logoTop,
            width: logoSize,
            height: logoSize,
            opacity: logoOpacity,
            filter: `url(#lab-tint) drop-shadow(0 2px 6px ${shadow})`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export default AiLaborersBillion;
