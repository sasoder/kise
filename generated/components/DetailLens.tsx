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
//
// A line is stored as proportions, not as fixed rectangles, because it has to
// be drawable at three levels of resolution without any of them being a
// separate object: whole line, words, characters. Opening the gaps is the only
// difference between them, and the ink redistributes so the line keeps its
// length — so subdividing is one continuous move rather than a crossfade
// between two drawings of the same thing.
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
const LH = 64;
const BH = 18;
const INDENT = 44;
const WORD_GAP = 13;
const CHAR_GAP = 7;
const N_LINES = 48;

type Line = {x: number; w: number; fracs: number[]; chars: number[]};

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

    const n = 3 + Math.floor(hash(i, 4) * 3);
    const wts: number[] = [];
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const wt = 0.55 + hash(i, 20 + k);
      wts.push(wt);
      sum += wt;
    }
    const fracs = wts.map((wt) => wt / sum);
    // Character count is fixed per word, taken from its settled width, so the
    // grain never changes count while it is opening.
    const settled = w - (n - 1) * WORD_GAP;
    // A word only subdivides if every piece would still be clearly wider than
    // the line is tall. Below that a piece stops reading as part of a line and
    // starts reading as a bead, so short words simply stay whole.
    const chars = fracs.map((f) =>
      Math.max(1, Math.floor((settled * f + CHAR_GAP) / (26 + CHAR_GAP))),
    );

    out.push({x, w, fracs, chars});
    inGroup++;
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The scroll
//
// One speed, reached before the clip starts and held almost all the way
// through, with a single soft deceleration onto the last beat. Authored as a
// velocity track and integrated, so the write head — which rides on it —
// cannot drift out of step with the material it is producing, and so there is
// never a change of pace for the eye to catch on.
// ---------------------------------------------------------------------------
const VF = [0, 40, 108, 126, 130];
const VV = [8.4, 7, 7, 1, 1];

// The log is already running when the clip cuts in, past the point where the
// head stops descending — so the first frame is a full column already moving
// at its cruising speed, with no start transient at all.
const PRE = 1180;

const PS: number[] = (() => {
  const out = [PRE];
  let p = PRE;
  for (let f = 1; f <= DURATION + 2; f++) {
    p += interpolate(f, VF, VV, CLAMP);
    out.push(p);
  }
  return out;
})();

// Once the head has written this far it stops descending and the column
// scrolls under it instead, so it settles below the lens and stays there.
const HEAD_ANCHOR = 1118;
// At cruising speed a line arrives every nine frames and takes eight to draw,
// so there is almost always exactly one line in flight — never a flock.
const WRITE_F = 8;

const WSTART = LINES.map((_, i) => {
  const target = i * LH;
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
  // How much of the disc's radius the edge falls off over. The magnified copy
  // and the plain one are complementary there, so the seam reads as a lens
  // rather than as a cut.
  feather: z.number().min(0).max(0.4),
  magnify: z.number().min(1).max(4),
  magnifyDetail: z.number().min(1).max(6),
  beats: z.object({
    // Beat frames lifted from the SRT at 24fps, f0 = 00:00:02,980.
    //   f0 like i have a   f14 pretty good   f24 understanding   f36 of what's
    //   f50 actually       f62 going on      f74 because we      f98 go through
    //   f105 things in     f117 detail (ends f130)
    lensOpen: z.number().int(),
    lensSet: z.number().int(),
    readOpen: z.number().int(),
    readSet: z.number().int(),
    wordsOpen: z.number().int(),
    wordsSet: z.number().int(),
    detail: z.number().int(),
    detailSet: z.number().int(),
  }),
});

export type DetailLensProps = z.infer<typeof schema>;

export const defaultProps: DetailLensProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#FFC543',
  shadow: 'rgba(0,0,0,0.28)',
  rawOpacity: 0.28,
  readOpacity: 0.9,
  lensCy: 832,
  lensR: 250,
  feather: 0.06,
  magnify: 1.75,
  magnifyDetail: 2.5,
  beats: {
    lensOpen: 24,
    lensSet: 40,
    readOpen: 25,
    readSet: 52,
    wordsOpen: 28,
    wordsSet: 54,
    detail: 114,
    detailSet: 129,
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
  feather,
  magnify,
  magnifyDetail,
  beats,
}) => {
  const frame = useCurrentFrame();

  const head = PS[Math.max(0, Math.min(PS.length - 1, Math.round(frame)))];
  const scroll = Math.max(0, head - HEAD_ANCHOR);

  const irisP = interpolate(frame, [beats.lensOpen, beats.lensSet], [0, 1], {
    ...CLAMP,
    easing: RISE,
  });
  const rNow =
    lensR *
    interpolate(frame, [beats.lensOpen, beats.lensSet], [0, 1], {
      ...CLAMP,
      easing: LAND,
    });

  // Words separate as the lens settles; characters separate at "detail". Same
  // partition both times, opened one step further — no second drawing of the
  // line is ever faded in over the first.
  const wordOpen = interpolate(frame, [beats.wordsOpen, beats.wordsSet], [0, 1], {
    ...CLAMP,
    easing: GLIDE,
  });
  const charOpen = interpolate(frame, [beats.detail, beats.detailSet], [0, 1], {
    ...CLAMP,
    easing: GLIDE,
  });
  const mag = interpolate(
    frame,
    [beats.wordsOpen, beats.wordsSet, beats.detail, beats.detailSet],
    [1, magnify, magnify, magnifyDetail],
    {...CLAMP, easing: GLIDE},
  );

  // The understood state does not flip on as a block when the lens opens: a
  // wave travels outward from the disc over its own, longer window, so the
  // reveal is a sweep rather than the whole column changing colour at once.
  const readP = interpolate(frame, [beats.readOpen, beats.readSet], [0, 1], {
    ...CLAMP,
    easing: GLIDE,
  });
  const lensOnAt = (y: number) =>
    clamp01(readP * 2 - clamp01((lensCy - lensR - y) / 760));

  // A line's state is a function of where it sits against the lens, not of a
  // parallel timer, so the ladder cannot drift if the scroll is retimed.
  const stateOf = (y: number) =>
    clamp01((lensCy + lensR - y) / (2 * lensR)) * lensOnAt(y);
  const opacityOf = (t: number) =>
    interpolate(t, [0, 0.4, 1], [rawOpacity, readOpacity, 0.94], CLAMP);
  const colourOf = (t: number) =>
    interpolateColors(clamp01((t - 0.5) / 0.42), [0, 1], [ink, accent]);

  type Row = {i: number; y: number; t: number; wp: number};
  const rows: Row[] = [];
  LINES.forEach((_, i) => {
    const start = WSTART[i];
    if (!Number.isFinite(start) || frame < start) return;
    const y = BAND_TOP + i * LH - scroll;
    if (y < 140 || y > BAND_BOT + 60) return;
    rows.push({i, y, t: stateOf(y), wp: clamp01((frame - start) / WRITE_F)});
  });

  const ease = (v: number) => 1 - (1 - v) * (1 - v);

  // The line at the current opening. Sub-units that are still touching are
  // merged into one run before anything is drawn — otherwise a closed-up line
  // is a row of butted capsules, whose semicircular ends pinch it into a
  // string of beads. Merged, the same partition draws as one bar, then as
  // words, then as syllables, with nothing crossfading.
  const runs = (L: Line, reach: number) => {
    const n = L.fracs.length;
    const gw = WORD_GAP * wordOpen;
    const gc = CHAR_GAP * charOpen;
    const availW = L.w - (n - 1) * gw;
    const out: {x: number; w: number}[] = [];
    let cur = 0;
    for (let k = 0; k < n; k++) {
      const ww = availW * L.fracs[k];
      const m = L.chars[k];
      const cw = (ww - (m - 1) * gc) / m;
      for (let c = 0; c < m; c++) {
        const x = cur + c * (cw + gc);
        if (x >= reach) break;
        const w = Math.min(cw, reach - x);
        const prev = out[out.length - 1];
        if (prev && x - (prev.x + prev.w) < 0.6) prev.w = x + w - prev.x;
        else out.push({x, w});
      }
      cur += ww + gw;
    }
    return out;
  };

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
          <radialGradient
            id="dl-inside"
            gradientUnits="userSpaceOnUse"
            cx={CX}
            cy={lensCy}
            r={Math.max(1, rNow)}
          >
            <stop offset={1 - feather} stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#000000" />
          </radialGradient>
          <radialGradient
            id="dl-outside"
            gradientUnits="userSpaceOnUse"
            cx={CX}
            cy={lensCy}
            r={Math.max(1, rNow)}
          >
            <stop offset={1 - feather} stopColor="#000000" />
            <stop offset="1" stopColor="#FFFFFF" />
          </radialGradient>
          {/* The column is a viewport that fades at both ends, with the lens
              taken out of it. The two masks are complementary, so the disc
              edge is a falloff between two resolutions of the same line
              rather than a cut between them. */}
          <mask id="dl-base" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
            <rect
              x="0"
              y={BAND_TOP - 46}
              width="1080"
              height={BAND_BOT - BAND_TOP + 92}
              fill="url(#dl-fade)"
            />
            <circle cx={CX} cy={lensCy} r={rNow} fill="url(#dl-outside)" />
          </mask>
          <mask id="dl-lens" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
            <circle cx={CX} cy={lensCy} r={rNow} fill="url(#dl-inside)" />
          </mask>
        </defs>

        <g mask="url(#dl-base)">
          {rows.map(({i, y, t, wp}) => {
            const L = LINES[i];
            return (
              <rect
                key={i}
                x={COL_X + L.x}
                y={y}
                width={Math.max(0.01, L.w * ease(wp))}
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
                y={y - 4}
                width={4}
                height={BH + 8}
                rx={2}
                fill={ink}
                opacity={0.7 * (0.3 + 0.7 * (1 - wp))}
              />
            );
          })}
        </g>

        <g mask="url(#dl-lens)">
          <g
            transform={`translate(${CX} ${lensCy}) scale(${mag.toFixed(4)}) translate(${-CX} ${-lensCy})`}
          >
            {rows.map(({i, y, t, wp}) => {
              if (Math.abs((y - lensCy) * mag) > lensR + 90) return null;
              const L = LINES[i];
              const c = colourOf(t);
              const o = opacityOf(t);
              return (
                <g key={`m${i}`}>
                  {runs(L, L.w * ease(wp)).map((s, k) => (
                    <rect
                      key={k}
                      x={COL_X + L.x + s.x}
                      y={y}
                      width={Math.max(0.01, s.w)}
                      height={BH}
                      rx={Math.min(BH / 2, s.w / 2)}
                      fill={c}
                      opacity={o}
                    />
                  ))}
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
          strokeWidth={4}
          opacity={0.88 * irisP}
        />
        <circle
          cx={CX}
          cy={lensCy}
          r={rNow + 15}
          fill="none"
          stroke={interpolateColors(
            interpolate(frame, [beats.detail, beats.detailSet], [0, 1], CLAMP),
            [0, 1],
            [ink, accent],
          )}
          strokeWidth={1.6}
          opacity={0.18 * irisP}
        />
      </svg>
    </AbsoluteFill>
  );
};

export default DetailLens;
