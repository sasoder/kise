import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:45.000 -> 00:00:50.939 of the source cut. round((50.939 - 45.000) * 30).
export const DURATION = 178;

// Anthropic's business as ten countable tenths. Same grain size and grid as
// ValueCreatedNotCaptured, which plays five seconds earlier — the small bin the
// labs kept there is the whole container here, so the systems read as one.
const COLS = 14;
const CELL = 24;
const G = 18;
const PAD = (CELL - G) / 2;
const BANDS = 10;
const ROWS_PER_BAND = 5;
const ROWS = BANDS * ROWS_PER_BAND;
const BAND_H = ROWS_PER_BAND * CELL;

const COL_W = COLS * CELL; // 336
const COL_H = ROWS * CELL; // 1200
// Not centred on the frame: the column plus Meta's mark is the composition, so
// that pair is what gets centred. 240 + 336 + 90 + 176 leaves 238 either side.
const COL_X0 = 240;
const COL_Y0 = 380;
const COL_Y1 = COL_Y0 + COL_H; // 1580

// The share is the bottom band: rows 45..49, one tenth of the column.
const SHARE_ROW0 = ROWS - ROWS_PER_BAND;
const SHARE_N = COLS * ROWS_PER_BAND;
const SHARE_Y = COL_Y1 - BAND_H / 2;

// The rumour rule overhangs the column so it reads as a claim about it rather
// than as one more piece of it.
const RULE_X0 = COL_X0 - 44;
const RULE_X1 = COL_X0 + COL_W + 44;

const META_W = 176;
const META_H = 117; // the artwork is 1.505:1, and one band is 120 tall
const META_X = COL_X0 + COL_W + 90;
const META_Y = SHARE_Y - META_H / 2;
const LEAD_X0 = COL_X0 + COL_W + 14;
const LEAD_X1 = META_X - 14;

const ANTHROPIC_S = 132;

const META = staticFile('meta.png');
const ANTHROPIC = staticFile('anthropic.png');

const ease = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
// The rumour settling: it overshoots its ceiling once before it sits down.
const land = {easing: Easing.out(Easing.back(1.1)), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const mix = (a: string, b: string, t: number) => {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const c = (i: number) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t);
  return `rgb(${c(1)}, ${c(3)}, ${c(5)})`;
};

// Painted as a colour behind the artwork's own alpha. Deliberately not an SVG
// filter reference: when Chrome fails to resolve one on a frame the element
// paints as nothing at all, which showed up as whole-field dropouts before.
const mark = (src: string, color: string): React.CSSProperties => ({
  backgroundColor: color,
  maskImage: `url(${src})`,
  WebkitMaskImage: `url(${src})`,
  maskSize: 'contain',
  WebkitMaskSize: 'contain',
  maskPosition: 'center',
  WebkitMaskPosition: 'center',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
});

// Rules land on a half pixel with an odd stroke, or identical lines antialias
// anywhere from 4% to 13% alpha and the whole field shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

// Stable per-grain scatter: organic, but identical on every frame, so nothing
// flickers between renders.
const hash = (a: number, b: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  ghost: z.number().min(0).max(0.3),
  // Beat frames from the SRT at 30fps, relative to 00:00:45.000:
  //   6 "or meta" · 31 "who at one point was" · 80 "rumored to"
  //   123 "as much as 10 of" · 148 "anthropik's business" · 178 out
  beats: z.object({
    meta: z.number().int(),
    column: z.number().int(),
    hunt: z.number().int(),
    lock: z.number().int(),
    own: z.number().int(),
  }),
});

export type MetaShareOfAnthropicProps = z.infer<typeof schema>;

export const defaultProps: MetaShareOfAnthropicProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  ghost: 0.1,
  beats: {meta: 6, column: 31, hunt: 80, lock: 123, own: 148},
});

const MetaShareOfAnthropic: React.FC<MetaShareOfAnthropicProps> = ({
  ink,
  accent,
  shadow,
  ghost,
  beats,
}) => {
  const frame = useCurrentFrame();

  // "rumored to be, at one point, as much as" — three hedges, so the marker
  // does not glide to an answer. It jumps between conflicting claims at
  // irregular intervals, then lands on the tenth and stays dashed forever.
  const hunts = [
    {f: beats.hunt, frac: 0.055, d: 0, land: false},
    {f: beats.hunt + 9, frac: 0.14, d: 3, land: false},
    {f: beats.hunt + 17, frac: 0.085, d: 3, land: false},
    {f: beats.hunt + 25, frac: 0.17, d: 3, land: false},
    {f: beats.hunt + 33, frac: 0.065, d: 3, land: false},
    {f: beats.lock, frac: 0.1, d: 6, land: true},
  ];
  let frac = hunts[0].frac;
  for (let i = 1; i < hunts.length; i++) {
    const h = hunts[i];
    frac = interpolate(frame, [h.f, h.f + h.d], [frac, h.frac], h.land ? land : ease);
  }

  const markerVis = interpolate(frame, [beats.hunt - 3, beats.hunt + 4], [0, 1], out);
  const lockP = interpolate(frame, [beats.lock + 2, beats.lock + 12], [0, 1], ease);
  const markerY = snap(COL_Y1 - frac * COL_H);

  // The context is drawn, read, then pushed back so the accent can exist on top
  // of it rather than fighting it.
  const drawP = interpolate(frame, [beats.column, beats.column + 18], [0, 1], out);
  // The container gives way to the accent, but the ten divisions have to survive
  // it: they are the only reason the share is a tenth rather than a guess.
  const recedeBox = interpolate(frame, [beats.lock, beats.lock + 16], [1, 0.42], ease);
  const recedeRule = interpolate(frame, [beats.lock, beats.lock + 16], [1, 0.62], ease);

  const ownP = interpolate(frame, [beats.own, beats.own + 18], [0, 1], out);
  const bindP = interpolate(frame, [beats.own, beats.own + 12], [0, 1], ease);
  const metaP = interpolate(frame, [beats.meta, beats.meta + 20], [0, 1], out);

  const grains: React.ReactElement[] = [];
  for (let row = 0; row < ROWS; row++) {
    const share = row >= SHARE_ROW0;

    for (let col = 0; col < COLS; col++) {
      const x = COL_X0 + col * CELL + PAD;
      const y = COL_Y0 + row * CELL + PAD;

      // The unnamed rest of the business materialises in scattered order, not
      // from the floor up: a bottom-up build reads as a level, and the only
      // level in this graphic is the share.
      const appearT = beats.column + hash(row, col) * 18;
      if (frame < appearT) continue;
      const appearP = interpolate(frame, [appearT, appearT + 9], [0, 1], out);

      let color = ink;
      let opacity = ghost * appearP;
      let scale = 1;

      if (share) {
        const k = (ROWS - 1 - row) * COLS + col;
        const releaseT = beats.lock + (k / SHARE_N) * 18;
        const p = interpolate(frame, [releaseT, releaseT + 7], [0, 1], out);
        color = mix(ink, accent, interpolate(p, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}));
        opacity = ghost * appearP + (0.96 - ghost * appearP) * p;
        scale = interpolate(p, [0.55, 1], [1.18, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      }

      grains.push(
        <rect
          key={`${row}-${col}`}
          x={x}
          y={y}
          width={G}
          height={G}
          rx={4}
          fill={color}
          opacity={opacity}
          style={scale === 1 ? undefined : {transformOrigin: `${x + G / 2}px ${y + G / 2}px`, transform: `scale(${scale})`}}
        />,
      );
    }
  }

  const rules: React.ReactElement[] = [];
  for (let b = 1; b < BANDS; b++) {
    const y = snap(COL_Y0 + b * BAND_H);
    const delay = beats.column + 4 + (BANDS - 1 - b) * 3;
    const p = interpolate(frame, [delay, delay + 12], [0, 1], out);
    rules.push(
      <path
        key={b}
        d={`M ${snap(COL_X0)} ${y} L ${snap(COL_X0 + COL_W)} ${y}`}
        stroke={ink}
        strokeWidth={3}
        opacity={0.58 * p * recedeRule}
        fill="none"
      />,
    );
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          {/* The whole business. Ten tenths, so the share is counted, not read. */}
          <rect
            x={snap(COL_X0)}
            y={snap(COL_Y0)}
            width={Math.round(COL_W)}
            height={Math.round(COL_H)}
            fill="none"
            stroke={ink}
            strokeWidth={3}
            opacity={0.82 * drawP * recedeBox}
          />
          {rules}
          {grains}

          {/* The rumour. It stays ink and stays dashed even after the share
              resolves — the quantity became known, the claim about it did not.
              Ink over the accent fill is also the only way it survives landing
              on it. Dash rhythm is deliberately off the 24px grain grid. */}
          <path
            d={`M ${snap(RULE_X0)} ${markerY} L ${snap(RULE_X1)} ${markerY}`}
            stroke={ink}
            strokeWidth={5}
            strokeDasharray="26 20"
            opacity={(0.55 + 0.35 * lockP) * markerVis}
            fill="none"
          />

          {/* Ties the lit tenth to whose it is, on the word. */}
          <path
            d={`M ${snap(LEAD_X0)} ${snap(SHARE_Y)} L ${snap(LEAD_X0 + (LEAD_X1 - LEAD_X0) * bindP)} ${snap(SHARE_Y)}`}
            stroke={accent}
            strokeWidth={3}
            opacity={0.7 * bindP}
            fill="none"
          />
        </svg>

        {/* Who the container belongs to. No type: the VO names them both. */}
        <div
          style={{
            position: 'absolute',
            left: COL_X0 + COL_W / 2 - ANTHROPIC_S / 2,
            top: 226,
            width: ANTHROPIC_S,
            height: ANTHROPIC_S,
            ...mark(ANTHROPIC, ink),
            opacity: 0.88 * ownP,
            transform: `translateY(${(1 - ownP) * -16}px)`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: META_X,
            top: META_Y,
            width: META_W,
            height: META_H,
            ...mark(META, mix(ink, accent, bindP)),
            opacity: (0.88 + 0.12 * bindP) * metaP,
            transform: `translateY(${(1 - metaP) * 16}px)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default MetaShareOfAnthropic;
