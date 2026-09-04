import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:35.219 -> 00:00:39.219 of Dylan_Two_Labs. round(4.0 * 30) = 120.
export const DURATION = 120;

const W = 1080;
const H = 1920;

// Two columns: logo on top, wafer under it, the stack it yields on the floor.
const COL_X = [300, 780];
const LOGO_Y = 500;
// The wafer empties, so the mark comes down and rests on what it produced.
const LOGO_REST_Y = 800;

const WAFER_Y = 840;
const WAFER_R = 186;

// A wafer flat, shallow enough that it only ever eats scrap, never a whole die.
const FLAT_K = 0.98;
const FLAT_Y = WAFER_R * FLAT_K;
const FLAT_X = WAFER_R * Math.sqrt(1 - FLAT_K * FLAT_K);
const WAFER_PATH = `M ${-FLAT_X} ${FLAT_Y} A ${WAFER_R} ${WAFER_R} 0 1 1 ${FLAT_X} ${FLAT_Y} Z`;

const CELL = 40;
const GAP = 12;
const PITCH = CELL + GAP;
const HALF = CELL / 2;
const RADIUS = 6;

const FLOOR = 1340;

const WAFER_DRAW = 12;
const CUT_LEN = 16;
const CUT_RAMP = 90;
const BREATH = 1.06;
const ROW_STAGGER = 2;
const FLIGHT = 16;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Fraction of a cell surviving both the wafer edge and the flat. Sampled rather
// than solved, so the classification and the drawn clip always agree.
const coverage = (x: number, y: number) => {
  const n = 9;
  let inside = 0;
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      const px = x - HALF + ((a + 0.5) * CELL) / n;
      const py = y - HALF + ((b + 0.5) * CELL) / n;
      if (Math.hypot(px, py) <= WAFER_R && py <= FLAT_Y) inside++;
    }
  }
  return inside / (n * n);
};

type Die = {i: number; j: number; x: number; y: number};

const WHOLE: Die[] = [];
const SCRAP: Die[] = [];
for (let j = -6; j <= 6; j++) {
  for (let i = -6; i <= 6; i++) {
    const x = (i + 0.5) * PITCH;
    const y = (j + 0.5) * PITCH;
    const f = coverage(x, y);
    if (f >= 0.995) WHOLE.push({i, j, x, y});
    else if (f >= 0.15) SCRAP.push({i, j, x, y});
  }
}

// Every die keeps the column it was cut in and simply falls, bottom row first,
// until the columns are floor-aligned. Nothing crosses anything, so 32 pieces
// moving at once still reads as one action.
const COLUMNS = [...new Set(WHOLE.map((d) => d.i))].sort((a, b) => a - b);

const LANES = [0, 1].map((lab) =>
  COLUMNS.flatMap((i) =>
    WHOLE.filter((d) => d.i === i)
      .sort((a, b) => b.j - a.j)
      .map((die, k) => ({
        die,
        x: COL_X[lab] + die.x,
        y: FLOOR - HALF - k * PITCH,
        // Rows leave bottom-first, with the outer columns a hair behind the
        // middle so the stack settles instead of arriving as one slab.
        delay: k * ROW_STAGGER + Math.abs(die.i + 0.5) * 0.25,
      })),
  ),
);

// Stable scatter so scrap looks tumbled, never noisy frame to frame.
const hash = (i: number, j: number) => {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  waferOpacity: z.number().min(0).max(1),
  rawOpacity: z.number().min(0).max(1),
  dieOpacity: z.number().min(0).max(1),
  scrapOpacity: z.number().min(0).max(1),
  sawOpacity: z.number().min(0).max(1),
  logos: z.object({left: z.string(), right: z.string()}),
  // Boxes are area-matched, not height-matched: the blossom is square and the
  // Anthropic glyph is wide and short, so equal boxes read as unequal marks.
  logoSize: z.object({left: z.number(), right: z.number()}),
  // Beat frames from the SRT at 30fps, relative to 00:00:35.219:
  //     0 "in addition"   ·  17 "openai and"  ·  27 "anthropic"
  //    35 "are also"      ·  44 "starting"    ·  51 "to build"
  //    60 "their own"     ·  69 "compute"     ·  89 "openai"
  //   100 "with their"    · 110 "own chips"
  beats: z.object({
    enterLeft: z.number().int(),
    enterRight: z.number().int(),
    waferLeft: z.number().int(),
    waferRight: z.number().int(),
    cutLeft: z.number().int(),
    cutRight: z.number().int(),
    selectLeft: z.number().int(),
    selectRight: z.number().int(),
    packLeft: z.number().int(),
    packRight: z.number().int(),
  }),
});

export type TwoLabsBuildOwnComputeProps = z.infer<typeof schema>;

export const defaultProps: TwoLabsBuildOwnComputeProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  waferOpacity: 0.32,
  rawOpacity: 0.4,
  dieOpacity: 0.92,
  scrapOpacity: 0.46,
  sawOpacity: 0.55,
  logos: {left: 'openai-logo.png', right: 'anthropic-logo.png'},
  logoSize: {left: 168, right: 200},
  beats: {
    // Each mark lands as its name is said; the saw crosses the wafer centre on
    // "to build"; the whole die are claimed on "their own" and fall on "compute".
    enterLeft: 15,
    enterRight: 25,
    waferLeft: 33,
    waferRight: 37,
    cutLeft: 45,
    cutRight: 49,
    selectLeft: 61,
    selectRight: 65,
    packLeft: 69,
    packRight: 73,
  },
});

const TwoLabsBuildOwnCompute: React.FC<TwoLabsBuildOwnComputeProps> = ({
  ink,
  accent,
  shadow,
  waferOpacity,
  rawOpacity,
  dieOpacity,
  scrapOpacity,
  sawOpacity,
  logos,
  logoSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const lanes = [
    {
      wafer: beats.waferLeft,
      cut: beats.cutLeft,
      select: beats.selectLeft,
      pack: beats.packLeft,
      enter: beats.enterLeft,
      logo: logos.left,
      size: logoSize.left,
    },
    {
      wafer: beats.waferRight,
      cut: beats.cutRight,
      select: beats.selectRight,
      pack: beats.packRight,
      enter: beats.enterRight,
      logo: logos.right,
      size: logoSize.right,
    },
  ];

  // The saw's position drives every reveal, so retiming the cut can never leave
  // a die lit ahead of the blade.
  const sawX = (lane: number) =>
    interpolate(
      frame,
      [lanes[lane].cut, lanes[lane].cut + CUT_LEN],
      [-WAFER_R - 24, WAFER_R + 24],
      clamp,
    );

  const revealOf = (lane: number, x: number) =>
    interpolate(sawX(lane) - (x - HALF), [0, CUT_RAMP], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="lab-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${parseInt(accent.slice(1, 3), 16) / 255} 0 0 0 0 ${
                parseInt(accent.slice(3, 5), 16) / 255
              } 0 0 0 0 ${parseInt(accent.slice(5, 7), 16) / 255} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <clipPath id="wafer-clip" clipPathUnits="userSpaceOnUse">
            <path d={WAFER_PATH} />
          </clipPath>
        </defs>

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {lanes.map((lane, l) => {
            const draw = interpolate(frame, [lane.wafer, lane.wafer + WAFER_DRAW], [0, 1], {
              ...clamp,
              easing: Easing.inOut(Easing.quad),
            });
            const gone = interpolate(frame, [lane.pack + 4, lane.pack + 22], [1, 0], clamp);
            const saw = sawX(l);
            const sawFade =
              interpolate(frame, [lane.cut, lane.cut + 3], [0, 1], clamp) *
              interpolate(frame, [lane.cut + CUT_LEN - 4, lane.cut + CUT_LEN], [1, 0], clamp);

            return (
              <g key={`wafer-${l}`} transform={`translate(${COL_X[l]} ${WAFER_Y})`}>
                <path
                  d={WAFER_PATH}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={waferOpacity * gone}
                  pathLength={1000}
                  strokeDasharray={1000}
                  strokeDashoffset={1000 * (1 - draw)}
                />

                {sawFade > 0 ? (
                  <g clipPath="url(#wafer-clip)">
                    <line
                      x1={saw}
                      y1={-WAFER_R}
                      x2={saw}
                      y2={WAFER_R}
                      stroke={accent}
                      strokeWidth={3}
                      opacity={sawOpacity * sawFade}
                    />
                  </g>
                ) : null}

                {SCRAP.map((s) => {
                  const reveal = revealOf(l, s.x);
                  if (reveal <= 0) return null;
                  const t = Math.max(0, frame - lane.select - hash(s.i, s.j) * 6);
                  const fade = interpolate(t, [0, 15], [1, 0], clamp);
                  if (fade <= 0) return null;
                  // Tumbling and dim, so it never reads as one of the good die.
                  const spin = (hash(s.j, s.i) - 0.5) * 2;
                  const held = interpolate(t, [0, 5], [scrapOpacity + 0.4, scrapOpacity], clamp);
                  return (
                    <g
                      key={`s-${s.i}-${s.j}`}
                      transform={`translate(${Math.sign(s.x) * 0.02 * t * t} ${
                        1.4 * t * t
                      }) rotate(${spin * t * 2.2} ${s.x} ${s.y})`}
                      opacity={reveal * held * fade}
                    >
                      <g clipPath="url(#wafer-clip)">
                        <rect
                          x={s.x - HALF}
                          y={s.y - HALF}
                          width={CELL}
                          height={CELL}
                          rx={RADIUS}
                          fill={ink}
                        />
                      </g>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <g>
            {LANES.map((lane, l) =>
              lane.map(({die, x, y, delay}) => {
                const reveal = revealOf(l, die.x);
                if (reveal <= 0) return null;

                const beat = lanes[l];
                // Claimed centre-outward, so the wafer reads as being sorted.
                const ripple = (Math.hypot(die.x, die.y) / WAFER_R) * 8;
                const sel = interpolate(
                  frame,
                  [beat.select + ripple, beat.select + ripple + 6],
                  [0, 1],
                  clamp,
                );
                const breath = interpolate(frame, [beat.select, beat.select + 7], [1, BREATH], {
                  ...clamp,
                  easing: Easing.out(Easing.quad),
                });

                const start = beat.pack + delay;
                const fall = interpolate(frame, [start, start + FLIGHT], [0, 1], {
                  ...clamp,
                  easing: Easing.in(Easing.quad),
                });

                const cx = interpolate(fall, [0, 1], [COL_X[l] + die.x * breath, x]);
                const cy = interpolate(fall, [0, 1], [WAFER_Y + die.y * breath, y]);

                // Volume-preserving squash on touchdown.
                const since = frame - (start + FLIGHT);
                const bump =
                  since < 0 ? 0 : Math.exp(-since / 3.5) * Math.cos(since / 1.6);
                const grow = interpolate(reveal, [0, 1], [0.55, 1], {
                  ...clamp,
                  easing: Easing.out(Easing.back(1.4)),
                });
                const wide = CELL * grow * (1 + 0.07 * bump);
                const tall = CELL * grow * (1 - 0.13 * bump);

                return (
                  <rect
                    key={`d-${l}-${die.i}-${die.j}`}
                    x={cx - wide / 2}
                    y={cy + (HALF * grow - tall)}
                    width={wide}
                    height={tall}
                    rx={RADIUS * grow}
                    fill={interpolateColors(sel, [0, 1], [ink, accent])}
                    opacity={reveal * interpolate(sel, [0, 1], [rawOpacity, dieOpacity])}
                  />
                );
              }),
            )}
          </g>
        </g>
      </svg>

      {lanes.map((lane, l) => {
        const pop = spring({
          frame: frame - lane.enter,
          fps,
          config: {damping: 13, mass: 0.7, stiffness: 140},
          durationInFrames: 18,
        });
        const settle = interpolate(frame, [lane.pack + 6, lane.pack + 34], [LOGO_Y, LOGO_REST_Y], {
          ...clamp,
          easing: Easing.inOut(Easing.cubic),
        });
        const rest = frame - (lane.pack + 34);
        const nod = rest <= 0 ? 0 : Math.exp(-rest / 4) * Math.sin(rest / 1.8);
        return (
          <Img
            key={`logo-${l}`}
            src={staticFile(lane.logo)}
            style={{
              position: 'absolute',
              left: COL_X[l] - lane.size / 2,
              top: settle - lane.size / 2,
              width: lane.size,
              height: lane.size,
              opacity: interpolate(frame, [lane.enter, lane.enter + 7], [0, 1], clamp),
              transform: `scale(${(0.72 + 0.28 * pop) * (1 - 0.02 * nod)})`,
              filter: `url(#lab-tint) drop-shadow(0 2px 6px ${shadow})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export default TwoLabsBuildOwnCompute;
