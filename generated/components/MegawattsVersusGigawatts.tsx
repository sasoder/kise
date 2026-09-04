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
// 00:00:06.419 -> 00:00:12.779 of the source cut. round(6.360 * 30) = 191.
export const DURATION = 191;

// One tile is one leading Chinese lab's entire fleet, taken at the generous end
// of his range (200 MW). 5x5 of them is exactly 5 GW, so the ratio on screen is
// countable rather than merely implied — and it under-claims (25x) instead of
// over-claiming (50x, which is what 100 MW would give).
const RAMP = 0.38; // width of the wavefront, in cell units

// The flag's own construction grid: 30x20, canton stars at these coordinates.
// Cropped to a square by mapping 18 units to the tile, so the star cluster keeps
// its proportion relative to the hoist.
const FLAG_UNITS = 18;
const BIG_STAR = {x: 5, y: 5, r: 3};
const SMALL_STARS = [
  {x: 10, y: 2},
  {x: 12, y: 4},
  {x: 12, y: 7},
  {x: 10, y: 9},
];

const starPath = (cx: number, cy: number, r: number, rot: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.382;
    const a = ((-90 + rot + i * 36) * Math.PI) / 180;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
};

export const schema = z.object({
  ink: z.string(),
  // Anthropic: the tile is the Claude terracotta stepped down, the glyph is it
  // at full strength — light mark on a dark ground.
  tile: z.string(),
  glyph: z.string(),
  glyphScale: z.number().min(0.2).max(0.9),
  flagRed: z.string(),
  flagStar: z.string(),
  shadow: z.string(),
  litOpacity: z.number().min(0).max(1),
  // Where the Chinese tile settles once it is context rather than subject. High
  // enough that the flag is still readable inside the finished block.
  ghostOpacity: z.number().min(0).max(1),
  // Odd, so there is a centre cell for the single tile to occupy.
  side: z.number().int().min(3).max(7),
  cell: z.number(),
  gap: z.number(),
  labels: z.object({half: z.string(), full: z.string()}),
  // Beat frames from the SRT at 30fps, relative to 00:00:06.419:
  //   13 "chinese" · 22 "labs have" · 40 "100 200" · 62 "megawatts"
  //   77 "total of" · 127 "whereas" · 133 "anthropic"
  //   164 "nearly 5" · 178 "gigawatts"
  beats: z.object({
    tile: z.number().int(),
    hundred: z.number().int(),
    megawatts: z.number().int(),
    total: z.number().int(),
    recede: z.number().int(),
    field: z.number().int(),
    gigawatts: z.number().int(),
  }),
});

export type MegawattsVersusGigawattsProps = z.infer<typeof schema>;

export const defaultProps: MegawattsVersusGigawattsProps = schema.parse({
  ink: '#FFFFFF',
  tile: '#8A422A',
  glyph: '#D97757',
  glyphScale: 0.7,
  flagRed: '#DE2910',
  flagStar: '#FFDE00',
  shadow: 'rgba(0, 0, 0, 0.28)',
  litOpacity: 0.95,
  ghostOpacity: 0.9,
  side: 5,
  cell: 160,
  gap: 20,
  labels: {half: '100 MW', full: '200 MW'},
  beats: {
    tile: 0,
    hundred: 40,
    megawatts: 62,
    total: 77,
    recede: 127,
    field: 133,
    gigawatts: 178,
  },
});

const MegawattsVersusGigawatts: React.FC<MegawattsVersusGigawattsProps> = ({
  ink,
  tile,
  glyph,
  glyphScale,
  flagRed,
  flagStar,
  shadow,
  litOpacity,
  ghostOpacity,
  side,
  cell,
  gap,
  labels,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const gridW = side * cell + (side - 1) * gap;
  const gx0 = (width - gridW) / 2;
  const gy0 = (height - gridW) / 2;
  const mid = (side - 1) / 2;
  const cellX = (c: number) => gx0 + c * (cell + gap);
  const cellY = (r: number) => gy0 + r * (cell + gap);
  const dMax = Math.SQRT2 * mid;

  // The one moving quantity for the whole second half: a radius in cell units.
  // Every tile's state is read off this, so the field cannot drift out of sync
  // with itself if the beats are retimed.
  // Constant speed, so the tile count per frame accelerates on its own as the
  // rings get bigger — the burst crescendos into "gigawatts" without a curve.
  const wavefront = interpolate(frame, [beats.field - 3, beats.gigawatts + 6], [1, dMax + RAMP], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tileP = (d: number) =>
    interpolate(wavefront - d, [0, RAMP], [0, 1], {
      easing: Easing.bezier(0.2, 1.5, 0.4, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  // "the leading chinese labs have" — the outline arrives empty.
  const birth = interpolate(frame, [beats.tile, beats.tile + 16], [0, 1], {
    easing: Easing.bezier(0.2, 1.4, 0.4, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "100 200": half, then all of it, landing full on "megawatts". The stars sit
  // inside this clip, so the flag completes as the second half is poured in.
  const fill = interpolate(
    frame,
    [beats.hundred, beats.hundred + 9, beats.hundred + 13, beats.megawatts],
    [0, 0.5, 0.5, 1],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  // The number arrives with the half fill and updates with the full one, so the
  // quantity is stated twice: as an area and as a figure.
  const labelIn = interpolate(frame, [beats.hundred + 7, beats.hundred + 17], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // A counter tick on the swap rather than a crossfade — two words in one spot
  // dissolving through each other reads as mush.
  const swap = interpolate(
    frame,
    [beats.megawatts - 4, beats.megawatts, beats.megawatts + 5],
    [1, 0.3, 1],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  // Out before the field reaches the cells either side of it.
  const labelOut = interpolate(frame, [beats.recede, beats.recede + 7], [1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "whereas": the first quantity steps back so the second one can exist.
  const recede = interpolate(frame, [beats.recede, beats.recede + 14], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "gigawatts": the completed block is claimed as one quantity.
  const landGrow = interpolate(frame, [beats.gigawatts, beats.gigawatts + 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const landFade = interpolate(
    frame,
    [beats.gigawatts - 1, beats.gigawatts + 1, beats.gigawatts + 12],
    [0, 0.5, 0],
    {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const flagAlpha = interpolate(recede, [0, 1], [1, ghostOpacity]);
  const tx = cellX(mid);
  const ty = cellY(mid);
  const u = cell / FLAG_UNITS;
  const fx = (x: number) => tx + x * u;
  const fy = (y: number) => ty + y * u;
  // Each small star aims one point at the centre of the big one, as on the flag.
  const smallStar = (st: {x: number; y: number}) =>
    starPath(
      fx(st.x),
      fy(st.y),
      u,
      (Math.atan2(BIG_STAR.y - st.y, BIG_STAR.x - st.x) * 180) / Math.PI + 90,
    );

  return (
    <AbsoluteFill>
      {/* "whereas anthropic ... nearly 5 gigawatts": 24 more of the same unit,
          spreading outward from the one already on screen. */}
      <AbsoluteFill style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        {Array.from({length: side * side}, (_, i) => {
          const r = Math.floor(i / side);
          const c = i % side;
          if (r === mid && c === mid) {
            return null;
          }
          const d = Math.hypot(r - mid, c - mid);
          const p = tileP(d);
          const s = 0.52 + 0.48 * p;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cellX(c),
                top: cellY(r),
                width: cell,
                height: cell,
                borderRadius: 10,
                backgroundColor: tile,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: Math.min(p, 1) * litOpacity,
                transform: `scale(${s})`,
              }}
            >
              <Img
                src={staticFile('claude.png')}
                style={{
                  width: cell * glyphScale,
                  height: cell * glyphScale,
                  // The PNG is already the terracotta; the matrix lets the glyph
                  // colour stay a prop without shipping a second asset.
                  filter: `url(#mvg-glyph)`,
                }}
              />
            </div>
          );
        })}
      </AbsoluteFill>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="mvg-glyph" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${parseInt(glyph.slice(1, 3), 16) / 255}
                       0 0 0 0 ${parseInt(glyph.slice(3, 5), 16) / 255}
                       0 0 0 0 ${parseInt(glyph.slice(5, 7), 16) / 255}
                       0 0 0 1 0`}
            />
          </filter>
          <clipPath id="mvg-tile">
            <rect x={tx} y={ty} width={cell} height={cell} rx={10} />
          </clipPath>
          <clipPath id="mvg-rise">
            <rect x={tx} y={ty + cell * (1 - fill)} width={cell} height={cell * fill} />
          </clipPath>
        </defs>

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The block, once whole, read as a single 5 GW quantity. */}
          <rect
            x={gx0 - 14 - 26 * landGrow}
            y={gy0 - 14 - 26 * landGrow}
            width={gridW + 28 + 52 * landGrow}
            height={gridW + 28 + 52 * landGrow}
            rx={26}
            fill="none"
            stroke={glyph}
            strokeWidth={2}
            opacity={landFade}
          />

          {/* The leading Chinese lab: one unit, and it stays that size. */}
          <g
            transform={`translate(${tx + cell / 2} ${ty + cell / 2}) scale(${0.86 + 0.14 * birth}) translate(${-(tx + cell / 2)} ${-(ty + cell / 2)})`}
            opacity={flagAlpha}
          >
            {/* The flag is there from the first frame — "the leading chinese
                labs" needs to land on sight — and the fill brightens it from
                the bottom rather than drawing it in. */}
            <g clipPath="url(#mvg-tile)">
              <g opacity={0.24 * birth}>
                <rect x={tx} y={ty} width={cell} height={cell} fill={flagRed} />
                <path
                  d={starPath(fx(BIG_STAR.x), fy(BIG_STAR.y), BIG_STAR.r * u, 0)}
                  fill={flagStar}
                />
                {SMALL_STARS.map((st) => (
                  <path key={`g${st.x}-${st.y}`} d={smallStar(st)} fill={flagStar} />
                ))}
              </g>
              <g clipPath="url(#mvg-rise)" opacity={litOpacity}>
                <rect x={tx} y={ty} width={cell} height={cell} fill={flagRed} />
                <path
                  d={starPath(fx(BIG_STAR.x), fy(BIG_STAR.y), BIG_STAR.r * u, 0)}
                  fill={flagStar}
                />
                {SMALL_STARS.map((st) => (
                  <path key={`f${st.x}-${st.y}`} d={smallStar(st)} fill={flagStar} />
                ))}
              </g>
            </g>
            <rect
              x={tx + 2}
              y={ty + 2}
              width={cell - 4}
              height={cell - 4}
              rx={9}
              fill="none"
              stroke={flagRed}
              strokeWidth={4}
              opacity={birth * 0.9}
            />
          </g>
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: ty + cell + 30,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: roboto.fontFamily,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1,
          letterSpacing: '0.11em',
          marginRight: '-0.11em',
          color: ink,
          opacity: labelIn * swap * labelOut * litOpacity,
          transform: `translateY(${14 * (1 - labelIn)}px) scale(${0.97 + 0.03 * swap})`,
          filter: `drop-shadow(0 2px 6px ${shadow})`,
        }}
      >
        {frame < beats.megawatts ? labels.half : labels.full}
      </div>
    </AbsoluteFill>
  );
};

export default MegawattsVersusGigawatts;
