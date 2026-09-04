import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:44.840 -> 00:00:56.679 of the source cut: "but we don't think enough
// about the fact that we're actually moving very fast into a regime where most
// people — like, in terms of the work output or something — is just
// concentrated within two labs, who are consuming more and more of the world's
// compute". round(11.839 * 30).
export const DURATION = 355;

const W = 1080;
const H = 1920;
const CX = 540;

// The lattice is inherited verbatim from the two clips before this one: 25
// columns at a 30px pitch, one dot per ten million people, 25 x 32 = 800 dots =
// eight billion. The viewer has already been taught this container twice, so it
// costs nothing to establish and everything it does here is new.
//
// What is new is the reading. He corrects himself mid-sentence — "most people,
// like, in terms of the work output" — so the claim is not that people move or
// vanish. It is that the same people's output changes hands. Which is why no
// dot in this clip ever leaves its cell: they only change colour in place.
const COLS = 25;
const ROWS = 32;
const PITCH = 30;
const N = COLS * ROWS;
const FIELD_W = COLS * PITCH; // 750
const FIELD_H = ROWS * PITCH; // 960
const X0 = CX - FIELD_W / 2; // 165
const Y1 = 1480; // the floor, unchanged from the previous clips
const Y0 = Y1 - FIELD_H; // 520
const CY = (Y0 + Y1) / 2; // 1000

// Two claim fronts, not one wipe and not a scatter. The seeds sit on real
// lattice cells at columns 7 and 17, which is the placement that buys the
// longest readable life for the shape: 300px apart, so the two circles stay
// visibly separate until they are a third of the way in, meet as a peanut in
// the middle of the sentence, and only then reach the walls of the world. A
// wider pair hits the side walls before it merges and reads as two blocks.
const SEED_COLS = [7, 17];
const SEED_ROW = 16;
const SEED_Y = Y1 - (SEED_ROW + 0.5) * PITCH; // 985, half a cell off centre
const seedX = (c: number) => X0 + (c + 0.5) * PITCH; // 330 and 750

// "Most", not "all". At this share the front stops with the top and bottom
// bands of the world still in ink — a visible minority rather than a wipe that
// happened to run out of canvas.
const MAX_SHARE = 0.72;

const BAR_Y = 1522;
const BAR_H = 38;
const BAR_BOT = BAR_Y + BAR_H;

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

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Half-pixel edges with an odd stroke, or identical rules antialias anywhere
// between 4% and 13% alpha and the field shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

type Cell = {
  x: number;
  y: number;
  d: number; // distance to the nearer seed — the only thing the front reads
  own: 0 | 1;
  ad: number; // distance from the field centre, for the arrival wave
  p1: number;
  p2: number;
};

// Built once at module scope: the lattice is fixed, only the read of it moves.
const CELLS: Cell[] = [];
// The same distances, sorted. The front is addressed by share rather than by
// radius, so the dot count, the front radius and the compute bar are all one
// number and cannot drift apart when the clip is retimed.
const DSORT = new Float64Array(N);
{
  const ax = seedX(SEED_COLS[0]);
  const bx = seedX(SEED_COLS[1]);
  const half = Math.hypot(FIELD_W, FIELD_H) / 2;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = X0 + (col + 0.5) * PITCH;
      const y = Y1 - (row + 0.5) * PITCH;
      const da = Math.hypot(x - ax, y - SEED_Y);
      const db = Math.hypot(x - bx, y - SEED_Y);
      const i = CELLS.length;
      CELLS.push({
        x,
        y,
        d: Math.min(da, db),
        own: da <= db ? 0 : 1,
        ad: Math.hypot(x - CX, y - CY) / half,
        p1: hash(i, 1) * Math.PI * 2,
        p2: hash(i, 11) * Math.PI * 2,
      });
    }
  }
  const ds = CELLS.map((c) => c.d).sort((a, b) => a - b);
  for (let i = 0; i < N; i++) DSORT[i] = ds[i];
}

// Radius of the front that claims exactly `share` of the field. Interpolated
// between neighbouring cells so the edge advances continuously rather than a
// dot at a time.
const frontRadius = (share: number) => {
  const kf = clamp01(share) * (N - 1);
  const i0 = Math.floor(kf);
  const i1 = Math.min(N - 1, i0 + 1);
  return DSORT[i0] + (DSORT[i1] - DSORT[i0]) * (kf - i0);
};

// The front, drawn. A lattice can only render a circle as a stair-step, so the
// shape of the claim is stated by a curve and the dots are left to be the
// count. Below the merge radius that is two circles; above it, the outline of
// their union — one continuous boundary traversed the same way round, so the
// two arcs join instead of closing into a lens.
const SEED_AX = seedX(SEED_COLS[0]);
const SEED_BX = seedX(SEED_COLS[1]);
const SEED_D = SEED_BX - SEED_AX;

const halfChord = (R: number) =>
  R <= SEED_D / 2 ? 0 : Math.sqrt(R * R - (SEED_D / 2) * (SEED_D / 2));

const contourPath = (R: number) => {
  if (R <= 0) return '';
  const h = halfChord(R);
  // Below a real chord the union path degenerates — its two arcs share a start
  // and an end, which SVG drops, and the outline vanishes for a frame at the
  // exact moment of the merge. Under 6px of chord the lens the two circles
  // would hide is a fifth of a pixel wide, so drawing them whole is identical
  // to the eye and continuous to the renderer.
  if (h < 6) {
    const circle = (cx: number) =>
      `M ${cx - R} ${SEED_Y} A ${R} ${R} 0 1 0 ${cx + R} ${SEED_Y} A ${R} ${R} 0 1 0 ${cx - R} ${SEED_Y} Z`;
    return `${circle(SEED_AX)} ${circle(SEED_BX)}`;
  }
  return [
    `M ${CX} ${SEED_Y - h}`,
    `A ${R} ${R} 0 1 0 ${CX} ${SEED_Y + h}`,
    `A ${R} ${R} 0 1 0 ${CX} ${SEED_Y - h}`,
    'Z',
  ].join(' ');
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // The world's work output, present and known — not the 0.10 unknown state.
  // It recedes twice: once so the accent can be read over it, once on
  // "concentrated", and it is never allowed to disappear.
  inkOpacity: z.number().min(0).max(1),
  inkFaded: z.number().min(0).max(1),
  inkContext: z.number().min(0).max(1),
  boundsOpacity: z.number().min(0).max(1),
  accentOpacity: z.number().min(0).max(1),
  contourOpacity: z.number().min(0).max(1),
  contourRestOpacity: z.number().min(0).max(1),
  // A claimed dot is bigger as well as bluer, so the change of state is said
  // twice and survives being scaled down on a phone.
  inkRadius: z.number().min(0.4).max(2),
  litRadius: z.number().min(0.4).max(2),
  seamOpacity: z.number().min(0).max(1),
  barTrackOpacity: z.number().min(0).max(1),
  barFillOpacity: z.number().min(0).max(1),
  markOpacity: z.number().min(0).max(1),
  yearOpacity: z.number().min(0).max(1),
  maxShare: z.number().min(0.2).max(0.95),
  strokeWidth: z.number().min(1).max(9),
  seamWidth: z.number().min(1).max(9),
  contourWidth: z.number().min(1).max(9),
  // Nothing in the field is ever perfectly still: a live supply, not a texture.
  driftAmp: z.number().min(0).max(20),
  years: z.array(z.string()).length(5),
  // Even spacing. Years are equal lengths and the ruler is not allowed to lie
  // about that — the speed is carried by the front, not by the clock.
  yearStep: z.number().int().min(10).max(90),
  yearSize: z.number().min(20).max(120),
  yearTop: z.number().min(0).max(600),
  // One per lab, in public/. Accent-tinted, so they read as structure.
  marks: z.array(z.string()).length(2),
  markSize: z.number().min(40).max(200),
  markTop: z.number().min(0).max(600),
  // Beat frames from the SRT at 30fps, relative to 00:00:44.840:
  //   0 "but we don't" · 17 "think enough" · 28 "about the"
  //   39 "fact that we're" · 55 "actually moving" · 72 "very fast"
  //   93 "into a regime" · 110 "where most" · 128 "people like in"
  //   154 "terms of" · 161 "like the work" · 182 "output or" · 194 "something"
  //   214 "is just like" · 233 "concentrated" · 249 "within two"
  //   280 "labs who are" · 299 "consuming more" · 320 "and more of the"
  //   330 "world's compute"
  beats: z.object({
    field: z.number().int(),
    seeds: z.number().int(),
    grow: z.number().int(),
    growEnd: z.number().int(),
    output: z.number().int(),
    concentrate: z.number().int(),
    seam: z.number().int(),
    marks: z.number().int(),
    compute: z.number().int(),
  }),
});

export type WorkOutputChangesHandsProps = z.infer<typeof schema>;

export const defaultProps: WorkOutputChangesHandsProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  inkOpacity: 0.64,
  inkFaded: 0.34,
  inkContext: 0.22,
  boundsOpacity: 0.26,
  accentOpacity: 0.92,
  contourOpacity: 0.6,
  contourRestOpacity: 0.42,
  inkRadius: 0.95,
  litRadius: 1.18,
  seamOpacity: 0.85,
  barTrackOpacity: 0.36,
  barFillOpacity: 0.9,
  markOpacity: 0.85,
  yearOpacity: 0.78,
  maxShare: MAX_SHARE,
  strokeWidth: 3,
  seamWidth: 5,
  contourWidth: 3,
  driftAmp: 1.1,
  years: ['2026', '2027', '2028', '2029', '2030'],
  yearStep: 38,
  yearSize: 58,
  yearTop: 268,
  marks: ['openai-logo.png', 'anthropic-logo.png'],
  markSize: 74,
  markTop: 372,
  // seeds land two frames ahead of "very fast" so the snap is resolved on the
  // word; marks land eight ahead of "labs" for the same reason.
  beats: {
    field: 0,
    seeds: 70,
    grow: 70,
    growEnd: 280,
    output: 161,
    concentrate: 233,
    seam: 249,
    marks: 272,
    compute: 297,
  },
});

// Slow in, hard through the middle, settled by the end of the sentence. The
// felt speed is the number of dots changing hands per frame, which peaks as the
// two circles meet at f145 and stays high through "the work output" — not the
// radius, which necessarily decelerates as the front sweeps equal-area annuli.
const growEase = Easing.bezier(0.42, 0, 0.32, 1);
// The front starts a little wider than a dot, so it blooms out of the seeds as
// one gesture instead of pausing at nothing while the ease-in gets going.
const R_START = 15;
const outCubic = Easing.out(Easing.cubic);

const WorkOutputChangesHands: React.FC<WorkOutputChangesHandsProps> = ({
  ink,
  accent,
  shadow,
  inkOpacity,
  inkFaded,
  inkContext,
  boundsOpacity,
  accentOpacity,
  contourOpacity,
  contourRestOpacity,
  inkRadius,
  litRadius,
  seamOpacity,
  barTrackOpacity,
  barFillOpacity,
  markOpacity,
  yearOpacity,
  maxShare,
  strokeWidth,
  seamWidth,
  contourWidth,
  driftAmp,
  years,
  yearStep,
  yearSize,
  yearTop,
  marks,
  markSize,
  markTop,
  beats,
}) => {
  const frame = useCurrentFrame();
  const [tr, tg, tb] = rgbOf(accent);

  // The radius is the driven quantity and everything else is read off it.
  // Driving the share instead — and looking the radius up in the sorted cell
  // distances — makes the front advance in steps the size of whatever gap
  // happens to sit next in that list, and those gaps run to a full 30px lattice
  // pitch. That was the stutter. Eased in distance, the radius never moves more
  // than about 4px in a frame.
  const rEnd = frontRadius(maxShare);
  const R = interpolate(frame, [beats.grow, beats.growEnd], [R_START, rEnd], {
    easing: growEase,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const started = frame >= beats.grow;

  // The wavefront is soft while it travels, so arrivals overlap and something
  // changes on every frame rather than a whole lattice ring landing at once —
  // and sharpens as it settles, so the boundary the clip rests on is crisp.
  const ramp = interpolate(R / rEnd, [0, 0.7, 1], [28, 46, 20], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Per-cell arrival, computed once and used for both the dots and the bar, so
  // the bar can never disagree with what is on screen.
  const prog = new Float64Array(N);
  let countA = 0;
  let countB = 0;
  for (let i = 0; i < N; i++) {
    // d === R gives exactly 0.5, so the count of half-lit cells is the count
    // the share asked for, whatever the ramp is doing. Which also means the two
    // seed cells, whose distance is zero, sit at half before anything has
    // happened — so the front is shut off until it starts, and the seeds are
    // the snap that starts it.
    const p = started ? clamp01((R + ramp * 0.5 - CELLS[i].d) / ramp) : 0;
    prog[i] = p;
    if (p >= 0.5) {
      if (CELLS[i].own === 0) countA++;
      else countB++;
    }
  }

  const bounds = interpolate(frame, [beats.field + 8, beats.field + 34], [0, 1], {
    easing: outCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The field comes alive on "actually moving", before anything is claimed.
  const live = interpolate(frame, [beats.seeds - 16, beats.seeds + 14], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Recede the context twice, in one monotonic ramp so the two steps cannot
  // cross: on "the work output", so the accent has somewhere to be read
  // against, and again on "concentrated".
  const inkLevel = interpolate(
    frame,
    [beats.output, beats.output + 22, beats.concentrate, beats.concentrate + 22],
    [inkOpacity, inkFaded, inkFaded, inkContext],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // "Concentrated": the claimed mass draws itself together. A breath that
  // settles a little denser than it started, rather than a move — nothing in
  // this clip is allowed to leave its cell.
  const gather = interpolate(
    frame,
    [beats.concentrate, beats.concentrate + 12, beats.concentrate + 34],
    [0, 1, 0.35],
    {easing: outCubic, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const contourIn = interpolate(frame, [beats.grow, beats.grow + 10], [0, 1], {
    easing: outCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Once the growth stops the boundary is context, not the event — the seam is
  // the event — so it settles back without ever leaving.
  const contourRest = interpolate(
    frame,
    [beats.growEnd - 24, beats.growEnd],
    [contourOpacity, contourRestOpacity],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const seamGrow = interpolate(frame, [beats.seam, beats.seam + 22], [0, 1], {
    easing: outCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // The same dividing line reaches down into the compute bar when it arrives:
  // one vertical tying "within two labs" to "the world's compute".
  const seamExt = interpolate(frame, [beats.compute + 6, beats.compute + 26], [0, 1], {
    easing: outCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const barOpen = interpolate(frame, [beats.compute, beats.compute + 16], [0, 1], {
    easing: outCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const barFill = interpolate(frame, [beats.compute + 14, beats.compute + 42], [0, 1], {
    easing: outCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const seedPop = interpolate(frame, [beats.seeds, beats.seeds + 8, beats.seeds + 30], [0, 1, 0], {
    easing: outCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const perim = 2 * (FIELD_W + FIELD_H);
  const r0 = PITCH * 0.187;
  // The two labs' shares of the world's compute, measured off the field itself.
  const leftW = (countA / N) * FIELD_W * barFill;
  const rightW = (countB / N) * FIELD_W * barFill;
  const openW = FIELD_W * barOpen;
  // The seam is exactly as long as the two fronts actually overlap: it runs
  // between the points where the circles cross, which is where the boundary
  // between the two territories genuinely exists. Read off the same R as the
  // contour, so it cannot claim ground the shape has not taken.
  const chord = Math.min(halfChord(R), (Y1 - Y0) / 2);
  const seamTop = SEED_Y - seamGrow * chord;
  const seamBottom = SEED_Y + seamGrow * chord + seamExt * (BAR_BOT - SEED_Y - chord);

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="woch-tint" colorInterpolationFilters="sRGB">
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
        <defs>
          <clipPath id="woch-bar">
            <rect x={CX - openW / 2} y={BAR_Y - 8} width={openW} height={BAR_H + 16} />
          </clipPath>
          <clipPath id="woch-field">
            <rect x={X0} y={Y0} width={FIELD_W} height={FIELD_H} rx={10} />
          </clipPath>
        </defs>

        {/* The world's work output. Eight hundred dots that arrive from the
            centre out and are then simply there for the whole clip — the point
            of the graphic is that this population never changes. */}
        {CELLS.map((c, i) => {
          const mat = clamp01((frame - beats.field - 4 - c.ad * 20) / 14);
          if (mat <= 0) return null;
          const p = prog[i];
          const amp = driftAmp * live;
          const dx = Math.sin(frame * 0.055 + c.p1) * amp;
          const dy = Math.sin(frame * 0.043 + c.p2) * amp * 0.8;
          // The crest is the visible edge of the claim: dots swell as the front
          // passes over them and settle behind it.
          const crest = clamp01(1 - Math.abs(c.d - R) / (ramp * 1.3)) * (started ? 1 : 0);
          const eased = 1 - Math.pow(1 - p, 3);
          const rr = r0 * (litRadius + eased * 0.14 * gather + crest * 0.16);
          return (
            <g key={i} transform={`translate(${c.x + dx} ${c.y + dy})`}>
              {p < 1 ? (
                <circle r={r0 * inkRadius * mat} fill={ink} opacity={inkLevel * mat * (1 - p)} />
              ) : null}
              {p > 0 ? (
                <circle r={rr * mat * eased} fill={accent} opacity={accentOpacity * mat} />
              ) : null}
            </g>
          );
        })}

        {/* The container the previous two clips established. Drawn on once and
            then left alone. */}
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

        {/* The boundary of the claim, stated as a curve because a square
            lattice can only ever render a circle as a stair-step. Two circles
            that grow, meet in the middle of the sentence and go on as one
            outline — so "two" is read from the shape long before the seam and
            the marks name it. Clipped to the world: the front is allowed to
            reach the walls, never to spill past them. */}
        {contourIn > 0 && started ? (
          <g clipPath="url(#woch-field)">
            <path
              d={contourPath(R)}
              fill="none"
              stroke={accent}
              strokeWidth={contourWidth}
              strokeLinejoin="round"
              opacity={contourRest * contourIn}
            />
          </g>
        ) : null}

        {/* Two seeds, snapped onto real lattice cells. They land as a snap on
            "very fast" — the whole of the speed claim is that this starts, and
            that everything after it is one continuous motion. */}
        {seedPop > 0
          ? SEED_COLS.map((col) => (
              <circle
                key={`pop${col}`}
                cx={seedX(col)}
                cy={SEED_Y}
                r={r0 * (1 + seedPop * 1.1)}
                fill={accent}
                opacity={accentOpacity}
              />
            ))
          : null}

        {/* The seam. It exists only once the two fronts have long since met, so
            it reads as the boundary that was always there rather than as a
            line drawn across a single mass. */}
        {seamGrow > 0 && chord > 0 ? (
          <line
            x1={snap(CX)}
            y1={seamTop}
            x2={snap(CX)}
            y2={seamBottom}
            stroke={accent}
            strokeWidth={seamWidth}
            opacity={seamOpacity}
          />
        ) : null}

        {/* The world's compute, on the same 750px ruler as the field and split
            on the same seam. Its fill is counted off the lattice, so the answer
            it gives is the answer already on screen — which is the point of the
            line: the share of output and the share of compute are one number. */}
        {barOpen > 0 ? (
          <g clipPath="url(#woch-bar)">
            <rect
              x={snap(X0)}
              y={snap(BAR_Y)}
              width={FIELD_W}
              height={BAR_H}
              rx={9}
              fill="none"
              stroke={ink}
              strokeWidth={strokeWidth}
              opacity={barTrackOpacity}
            />
            {leftW > 0.5 ? (
              <rect
                x={CX - leftW}
                y={BAR_Y + 6}
                width={leftW}
                height={BAR_H - 12}
                fill={accent}
                opacity={barFillOpacity}
              />
            ) : null}
            {rightW > 0.5 ? (
              <rect
                x={CX}
                y={BAR_Y + 6}
                width={rightW}
                height={BAR_H - 12}
                fill={accent}
                opacity={barFillOpacity}
              />
            ) : null}
          </g>
        ) : null}
      </svg>

      {/* One clock, ticking evenly. It is the unit "very fast" is measured in;
          the acceleration belongs to the front, not to the years. */}
      <div style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        {years.map((y, k) => {
          const t0 = beats.seeds + k * yearStep;
          const t1 = t0 + yearStep;
          const inA = interpolate(frame, [t0, t0 + 8], [0, 1], {
            easing: outCubic,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const outA =
            k === years.length - 1
              ? 1
              : interpolate(frame, [t1 - 8, t1], [1, 0], {
                  easing: Easing.in(Easing.cubic),
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
          const a = Math.min(inA, outA);
          if (a <= 0) return null;
          return (
            <div
              key={y}
              style={{
                position: 'absolute',
                left: CX,
                top: yearTop + (1 - inA) * 10 - (1 - outA) * 10,
                transform: 'translateX(-50%)',
                opacity: yearOpacity * a,
              }}
            >
              <span
                style={{
                  fontFamily: roboto.fontFamily,
                  fontWeight: 700,
                  fontSize: yearSize,
                  lineHeight: 1,
                  letterSpacing: '0.11em',
                  // Cancels the trailing tracking so translateX centres the
                  // glyphs rather than the letterspacing.
                  marginRight: '-0.11em',
                  whiteSpace: 'nowrap',
                  color: ink,
                  display: 'inline-block',
                }}
              >
                {y}
              </span>
            </div>
          );
        })}
      </div>

      {/* The two marks, each standing over the centre of its own territory, so
          the split the seam just made is named without a word of label. */}
      {marks.map((m, k) => {
        const a = interpolate(frame, [beats.marks + k * 6, beats.marks + k * 6 + 16], [0, 1], {
          easing: outCubic,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (a <= 0 || m === '') return null;
        const x = seedX(SEED_COLS[k]);
        return (
          <Img
            key={m}
            src={staticFile(m)}
            style={{
              position: 'absolute',
              left: x - markSize / 2,
              top: markTop + (1 - a) * 12,
              width: markSize,
              height: markSize,
              opacity: markOpacity * a,
              filter: `url(#woch-tint) drop-shadow(0 2px 6px ${shadow})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export default WorkOutputChangesHands;
