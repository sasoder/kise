import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
// 00:00:02,980 -> 00:00:08,400 of the source cut. round(5.420 * 24) = 130.
export const DURATION = 130;

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Stable per-line scatter: same shape every frame and every render.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// ---------------------------------------------------------------------------
// The column
//
// One repeating unit — a line of review material — on one grid, with one gap.
// Nothing here is a glyph; the indents and the ragged right edge are what make
// a stack of rounded bars read as dense text rather than as a bar chart.
// A line carries three levels of granularity of itself, and which one you see
// is purely a function of how much the lens is magnifying it: whole line,
// words, characters. That is the only thing "detail" means in this piece.
// ---------------------------------------------------------------------------
const CX = 540;
const COL_W = 560;
// Two things fix the column's x. Left-aligned ragged text is not optically
// centred by its box — the mean inked line runs to about 0.6 of the column —
// so the box is offset until the ink, not the box, is centred on the lens
// axis. And the column is narrower than the lens is wide, so a row being read
// is almost entirely inside the disc rather than trailing out beside it.
const COL_X = 343;
const BAND_TOP = 212;
const BAND_BOT = 1452;
const LH = 58;
const BH = 17;
const INDENT = 44;
const WORD_GAP = 13;
const CHAR_GAP = 5;
const N_LINES = 72;

type Seg = {x: number; w: number};
type Line = {x: number; w: number; words: Seg[]; chars: Seg[]};

const LINES: Line[] = (() => {
  const out: Line[] = [];
  let inGroup = 0;
  let groupLen = 0;
  for (let i = 0; i < N_LINES; i++) {
    if (inGroup >= groupLen) {
      inGroup = 0;
      groupLen = 2 + Math.floor(hash(i, 7) * 4);
    }
    const first = inGroup === 0;
    const last = inGroup === groupLen - 1;
    // Level 0 opens a group, the body sits one or two in, and a long group
    // closes back out — the shape of written material, without writing any.
    const level = first ? 0 : last && groupLen > 2 ? 1 : hash(i, 1) > 0.72 ? 2 : 1;
    const x = level * INDENT;
    const room = COL_W - x;
    const w = room * (level === 0 ? 0.52 + hash(i, 2) * 0.34 : 0.3 + hash(i, 3) * 0.52);

    const n = 3 + Math.floor(hash(i, 4) * 4);
    const avail = w - (n - 1) * WORD_GAP;
    const wts: number[] = [];
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const wt = 0.55 + hash(i, 20 + k);
      wts.push(wt);
      sum += wt;
    }
    const words: Seg[] = [];
    const chars: Seg[] = [];
    let cur = 0;
    wts.forEach((wt, k) => {
      const ww = (avail * wt) / sum;
      words.push({x: cur, w: ww});
      // Characters partition the word they belong to, so subdividing never
      // changes where the ink is — only how finely it is broken up.
      const m = Math.max(3, Math.round(ww / 15));
      const cw = (ww - (m - 1) * CHAR_GAP) / m;
      for (let c = 0; c < m; c++) chars.push({x: cur + c * (cw + CHAR_GAP), w: cw});
      cur += ww + WORD_GAP;
      void k;
    });

    out.push({x, w, words, chars});
    inGroup++;
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The scroll
//
// Authored as a velocity track and integrated, so the column never changes
// speed abruptly and the write head, which rides on it, cannot drift out of
// step with the material it is producing.
//
//   f0-38    the log runs fast and settles
//   f24-70   steady read
//   f74-104  "because we go through things" — a surge of material
//   f116-130 "detail" — everything decelerates onto one magnified fragment
// ---------------------------------------------------------------------------
const VF = [0, 14, 28, 38, 70, 86, 104, 116, 126, 130];
const VV = [46, 34, 16, 10.4, 10.4, 24, 24, 8, 1.4, 1.4];

// The clip cuts in mid-sentence, so the log is already running at frame 0.
const PRE = 980;

const PS: number[] = (() => {
  const out = [PRE];
  let p = PRE;
  for (let f = 1; f <= DURATION + 2; f++) {
    p += interpolate(f, VF, VV, CLAMP);
    out.push(p);
  }
  return out;
})();

// Once the head has written this far, it stops descending and the column
// scrolls under it instead — so it settles below the lens and stays there.
const HEAD_ANCHOR = 1118;
const WRITE_F = 6;

// Each line starts drawing when the head reaches it. During the flood several
// are in flight at once; once the scroll settles they barely overlap.
const WSTART = LINES.map((_, i) => {
  const target = i * LH;
  // Lines the head already passed before the cut start off-screen in time, so
  // the first frame shows a flood in progress rather than an empty column.
  if (PS[0] >= target) return (target - PRE) / VV[0];
  for (let f = 0; f < PS.length; f++) if (PS[f] >= target) return f;
  return Infinity;
});

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // The three states. Raw material sits low but has to survive arbitrary
  // footage, so it is a little above the usual unknown floor.
  rawOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  lensCy: z.number().min(400).max(1520),
  lensR: z.number().min(120).max(420),
  // Magnification at the settled read, and at "detail".
  magnify: z.number().min(1).max(4),
  magnifyDetail: z.number().min(1).max(6),
  beats: z.object({
    // Beat frames lifted from the SRT at 24fps, f0 = 00:00:02,980.
    //   f0 like i have a   f14 pretty good   f24 understanding   f36 of what's
    //   f50 actually       f62 going on      f74 because we      f98 go through
    //   f105 things in     f117 detail (ends f130)
    lensOpen: z.number().int(),
    lensSet: z.number().int(),
    magIn: z.number().int(),
    magSet: z.number().int(),
    detail: z.number().int(),
    detailSet: z.number().int(),
  }),
});

export type DetailLensProps = z.infer<typeof schema>;

export const defaultProps: DetailLensProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#FFC543',
  shadow: 'rgba(0,0,0,0.28)',
  rawOpacity: 0.24,
  readOpacity: 0.92,
  lensCy: 832,
  lensR: 250,
  magnify: 1.9,
  magnifyDetail: 3.0,
  beats: {
    lensOpen: 24,
    lensSet: 38,
    magIn: 26,
    magSet: 50,
    detail: 114,
    detailSet: 128,
  },
});

const LAND = Easing.out(Easing.back(1.5));
const GLIDE = Easing.inOut(Easing.cubic);
const RISE = Easing.out(Easing.cubic);

export const DetailLens: React.FC<DetailLensProps> = ({
  ink,
  accent,
  shadow,
  rawOpacity,
  readOpacity,
  lensCy,
  lensR,
  magnify,
  magnifyDetail,
  beats,
}) => {
  const frame = useCurrentFrame();

  const head = PS[Math.max(0, Math.min(PS.length - 1, Math.round(frame)))];
  const scroll = Math.max(0, head - HEAD_ANCHOR);

  // The iris. It lands with the shared overshoot, so the lens arrives rather
  // than fades up.
  const rNow =
    lensR *
    interpolate(frame, [beats.lensOpen, beats.lensSet], [0, 1], {
      ...CLAMP,
      easing: LAND,
    });
  const lensOn = interpolate(frame, [beats.lensOpen, beats.lensSet], [0, 1], {
    ...CLAMP,
    easing: RISE,
  });

  const mag = interpolate(
    frame,
    [beats.magIn, beats.magSet, beats.detail, beats.detailSet],
    [1, magnify, magnify, magnifyDetail],
    {...CLAMP, easing: GLIDE},
  );
  // Words break into characters as the magnification passes through. The two
  // partitions occupy the same ink, so this reads as one thing subdividing.
  const grain = clamp01((mag - 2.25) / 0.45);

  // A line's state is a function of where it sits against the lens, not of a
  // parallel timer, so the ladder cannot drift if the scroll is retimed.
  const stateOf = (yBase: number) =>
    clamp01((lensCy + lensR - yBase) / (2 * lensR)) * lensOn;
  const opacityOf = (t: number) =>
    interpolate(t, [0, 0.35, 1], [rawOpacity, readOpacity, 0.95], CLAMP);
  const colourOf = (t: number) =>
    interpolateColors(clamp01((t - 0.45) / 0.45), [0, 1], [ink, accent]);

  type Row = {i: number; y: number; t: number; wp: number};
  const rows: Row[] = [];
  LINES.forEach((_, i) => {
    const start = WSTART[i];
    if (!Number.isFinite(start) || frame < start) return;
    const y = BAND_TOP + i * LH - scroll;
    if (y < 150 || y > BAND_BOT + 60) return;
    rows.push({
      i,
      y,
      t: stateOf(y),
      wp: clamp01((frame - start) / WRITE_F),
    });
  });

  const ease = (v: number) => 1 - (1 - v) * (1 - v);

  return (
    <AbsoluteFill>
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
      >
        <defs>
          <linearGradient id="dl-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000000" />
            <stop offset="0.07" stopColor="#FFFFFF" />
            <stop offset="0.93" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#000000" />
          </linearGradient>
          {/* The column is a viewport that fades at both ends, with the lens
              punched out of it — inside the disc you only ever see the
              magnified copy, never both at once. */}
          <mask id="dl-base" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
            <rect
              x="0"
              y={BAND_TOP - 46}
              width="1080"
              height={BAND_BOT - BAND_TOP + 92}
              fill="url(#dl-fade)"
            />
            <circle cx={CX} cy={lensCy} r={rNow} fill="#000000" />
          </mask>
          <clipPath id="dl-lens">
            <circle cx={CX} cy={lensCy} r={Math.max(0, rNow - 1)} />
          </clipPath>
        </defs>

        <g mask="url(#dl-base)">
          {rows.map(({i, y, t, wp}) => {
            const L = LINES[i];
            const w = L.w * ease(wp);
            return (
              <rect
                key={i}
                x={COL_X + L.x}
                y={y}
                width={Math.max(0.01, w)}
                height={BH}
                rx={BH / 2}
                fill={colourOf(t)}
                opacity={opacityOf(t)}
              />
            );
          })}
          {/* The write head. Its click-bright is the caret dissolving as the
              line completes, so the flash never reads as a line being read. */}
          {rows.map(({i, y, wp}) => {
            if (wp >= 1) return null;
            const L = LINES[i];
            return (
              <rect
                key={`c${i}`}
                x={COL_X + L.x + L.w * ease(wp)}
                y={y - 5}
                width={5}
                height={BH + 10}
                rx={2.5}
                fill={ink}
                opacity={0.85 * (0.35 + 0.65 * (1 - wp))}
              />
            );
          })}
        </g>

        <g clipPath="url(#dl-lens)">
          <g
            transform={`translate(${CX} ${lensCy}) scale(${mag.toFixed(4)}) translate(${-CX} ${-lensCy})`}
          >
            {rows.map(({i, y, t, wp}) => {
              const yMag = lensCy + (y - lensCy) * mag;
              if (Math.abs(yMag - lensCy) > lensR + 80) return null;
              const L = LINES[i];
              const reach = L.w * ease(wp);
              const c = colourOf(t);
              const o = opacityOf(t);
              return (
                <g key={`m${i}`}>
                  {L.words.map((s, k) =>
                    s.x >= reach ? null : (
                      <rect
                        key={`w${k}`}
                        x={COL_X + L.x + s.x}
                        y={y}
                        width={Math.max(0.01, Math.min(s.w, reach - s.x))}
                        height={BH}
                        rx={BH / 2}
                        fill={c}
                        opacity={o * (1 - grain)}
                      />
                    ),
                  )}
                  {grain > 0
                    ? L.chars.map((s, k) =>
                        s.x >= reach ? null : (
                          <rect
                            key={`h${k}`}
                            x={COL_X + L.x + s.x}
                            y={y}
                            width={Math.max(0.01, Math.min(s.w, reach - s.x))}
                            height={BH}
                            rx={BH / 3}
                            fill={c}
                            opacity={o * grain}
                          />
                        ),
                      )
                    : null}
                </g>
              );
            })}
          </g>
        </g>

        <circle
          cx={CX}
          cy={lensCy}
          r={rNow}
          fill="none"
          stroke={ink}
          strokeWidth={4.5}
          opacity={0.9 * lensOn}
        />
        <circle
          cx={CX}
          cy={lensCy}
          r={rNow + 16}
          fill="none"
          stroke={interpolateColors(
            interpolate(frame, [beats.detail, beats.detailSet], [0, 1], CLAMP),
            [0, 1],
            [ink, accent],
          )}
          strokeWidth={1.8}
          opacity={0.24 * lensOn}
        />
      </svg>
    </AbsoluteFill>
  );
};

export default DetailLens;
