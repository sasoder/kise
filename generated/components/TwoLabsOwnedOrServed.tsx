import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:01:01.479 -> 00:01:08.439 of the source cut. round(6.960 * 30) = 209.
// Butts against the last frame of TwoLabsIncrementalHalf and hands off to
// TwoLabsFlopsHold on "you've got them just".
export const DURATION = 209;

// One shape language, used twice: a claimed span of an axis. First a straight
// axis, where the span is time — how soon. Then a circular one, where the span
// is share — how much. The scene is the same gesture bent into a ring.

// --- The near horizon ------------------------------------------------------
const AXIS_Y = 620;
const NOW_X = 140;
// One year of runway. Two years therefore lands on 540, the centre line, which
// is where the world opens up in the second half.
const YEAR = 200;
// The axis stops being drawn here but fades rather than ending, so the two
// years read as a short piece of something that keeps going.
const AXIS_X1 = 1016;
const FADE_FROM = 0.9;

const AXIS_W = 6;
// The span is the event on this axis, so it is nearly three times the weight of
// the axis it is measured on. At parity the two lines merged into one rule.
const SPAN_W = 15;
const YEAR_TICK = 26;
const HALF_TICK = 14;
const NOW_TICK = 38;
const HEAD_TICK = 32;

const yearX = (y: number) => NOW_X + y * YEAR;

// --- The world's compute ---------------------------------------------------
const CX = 540;
const CY = 1080;
const R_OUT = 306;
const R_IN = 198;
const R_MID = (R_IN + R_OUT) / 2;
// Segments are separated so the share is counted in eighths rather than
// estimated off an arc, the same reason the gigawatt rungs were separated.
const SEG_GAP = 3.4;
const SEG_STROKE = 10;
// Served segments are drawn outward, into the boundary that has just collected
// them. They move because something took them, not because they grew.
const SERVED_PULL = 10;

// Well clear of the ring: at 30px out it read as a rim on the donut instead of
// a claim drawn around it.
const ARC_R = R_OUT + 52;
const ARC_W = 9;
const ARC_CAP = 32;

// How far the claim front travels while it converts a segment it has reached.
// A segment is therefore always mid-change while the front is still on it.
const CONVERT_ARC = 30;

const DROP_Y0 = AXIS_Y + 22;
const DROP_Y1 = CY - R_OUT - 16;

const LABEL_SIZE = 50;
const LABEL_TOP = 1478;
const MARK_SIZE = 46;
const MARK_TOP = AXIS_Y - 96;
const UNIT_SIZE = 34;

// Half-pixel snap with an odd stroke width, or the horizontals antialias to
// anywhere between 4% and 13% alpha and the axis shimmers.
const snap = (v: number) => Math.round(v) + 0.5;
const AXIS_LINE_Y = snap(AXIS_Y);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (r: number, deg: number) =>
  [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))] as const;

const annulus = (a0: number, a1: number, rIn: number, rOut: number) => {
  const [x0, y0] = pt(rOut, a0);
  const [x1, y1] = pt(rOut, a1);
  const [x2, y2] = pt(rIn, a1);
  const [x3, y3] = pt(rIn, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3} Z`;
};

const arcPath = (r: number, a0: number, a1: number) => {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
};

const typeStyle = (size: number, ink: string): React.CSSProperties => ({
  position: 'absolute',
  fontFamily: roboto.fontFamily,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: '0.11em',
  marginRight: '-0.11em',
  whiteSpace: 'nowrap',
  color: ink,
});

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // Three states: unknown, read, claimed. The axis runs the first two before
  // the ring exists, so the ring can arrive already read.
  dimOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  ownedOpacity: z.number().min(0).max(1),
  // Served but not owned keeps its ink fill and takes an accent outline: it is
  // still somebody else's material, with a line drawn round it. Tried as a
  // half-strength accent fill first, which just read as switched off.
  servedOpacity: z.number().min(0).max(1),
  markOpacity: z.number().min(0).max(1),
  // How far the axis recedes once the ring takes over. Annotation cannot be
  // laid over a live field; the field has to give way first.
  recede: z.number().min(0).max(1),
  segments: z.object({
    total: z.number().int().min(4),
    owned: z.number().int().min(1),
    served: z.number().int().min(0),
  }),
  label: z.string(),
  nowLabel: z.string(),
  unitLabel: z.string(),
  logos: z.object({left: z.string(), right: z.string()}),
  // Area-matched, not height-matched: the blossom is square and the Anthropic
  // glyph is wide and short, so equal boxes read as unequal marks.
  logoSize: z.object({left: z.number(), right: z.number()}),
  logoGap: z.number(),
  // Beat frames from the SRT at 30fps, relative to 00:01:01.479:
  //     0 "very soon"      ·  19 "you're saying"  ·  25 "maybe within a"
  //    49 "year"           ·  52 "and a half"     ·  62 "or two years"
  //    83 "and most of the"·  97 "world's"        · 102 "compute is"
  //   120 "owned by"       · 130 "two labs or at" · 155 "least is"
  //   164 "serving"        · 172 "the demand"     · 187 "from two labs"
  beats: z.object({
    axis: z.number().int(),
    within: z.number().int(),
    year: z.number().int(),
    half: z.number().int(),
    twoYears: z.number().int(),
    most: z.number().int(),
    world: z.number().int(),
    compute: z.number().int(),
    owned: z.number().int(),
    twoLabs: z.number().int(),
    least: z.number().int(),
    fromTwo: z.number().int(),
  }),
});

export type TwoLabsOwnedOrServedProps = z.infer<typeof schema>;

export const defaultProps: TwoLabsOwnedOrServedProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.26,
  readOpacity: 0.85,
  ownedOpacity: 0.92,
  servedOpacity: 0.68,
  markOpacity: 0.5,
  recede: 0.34,
  // Five eighths owned outright, two more serving their demand, one eighth
  // left. "Most of" has to be visibly more than half without being all of it.
  segments: {total: 8, owned: 5, served: 2},
  label: "THE WORLD'S COMPUTE",
  nowLabel: 'NOW',
  unitLabel: 'YEARS',
  logos: {left: 'openai-logo.png', right: 'anthropic-logo.png'},
  logoSize: {left: 124, right: 148},
  logoGap: 48,
  beats: {
    // The cut arrives on a full frame, so the axis is already half drawn.
    axis: -8,
    within: 25,
    year: 49,
    half: 52,
    twoYears: 62,
    most: 83,
    world: 97,
    compute: 102,
    owned: 120,
    twoLabs: 130,
    least: 155,
    fromTwo: 187,
  },
});

// Fast departure, long settle. No overshoot anywhere: a span that overshoots
// misreports its own quantity, however briefly.
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

const TwoLabsOwnedOrServed: React.FC<TwoLabsOwnedOrServedProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  readOpacity,
  ownedOpacity,
  servedOpacity,
  markOpacity,
  recede,
  segments,
  label,
  nowLabel,
  unitLabel,
  logos,
  logoSize,
  logoGap,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const STEP = 360 / segments.total;
  const OWNED_ARC = segments.owned * STEP;
  const SERVED_ARC = segments.served * STEP;

  // --- The axis ------------------------------------------------------------
  // How much runway has been laid. Ticks and numerals are lit from this rather
  // than from their own timers, so nothing can appear ahead of the line it
  // stands on.
  const axisX1 = interpolate(frame, [beats.axis, beats.axis + 30], [NOW_X, AXIS_X1], {
    easing: EXPO,
    ...clamp,
  });

  // The head of the claimed span, in pixels. Three pushes, one per phrase; it
  // stands still between them.
  const headX =
    NOW_X +
    interpolate(frame, [beats.within, beats.year], [0, YEAR], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    }) +
    interpolate(frame, [beats.half, beats.twoYears], [0, YEAR / 2], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    }) +
    interpolate(frame, [beats.twoYears + 2, beats.twoYears + 18], [0, YEAR / 2], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    });

  const spanOn = interpolate(frame, [beats.within - 4, beats.within + 8], [0, 1], clamp);
  const axisDim = 1 - (1 - recede) * interpolate(frame, [beats.most + 6, beats.most + 22], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });

  const tickOn = (x: number) => clamp01((axisX1 - x) / 44);
  // A numeral brightens as the head arrives on it and dims as it leaves, which
  // makes "a year and a half" land between two marks instead of on one.
  const nearHead = (x: number) => clamp01(1 - Math.abs(headX - x) / 58) * spanOn;
  const fadeAt = (x: number) =>
    interpolate(x, [NOW_X + (AXIS_X1 - NOW_X) * FADE_FROM, AXIS_X1], [1, 0], clamp);

  // --- The ring ------------------------------------------------------------
  const ringStart = beats.world - 3;
  const segIn = (i: number) =>
    interpolate(frame, [ringStart + i * 2.5, ringStart + i * 2.5 + 12], [0, 1], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    });

  // The one scalar the whole second half reads: how far round the claim has
  // swept, in degrees from twelve o'clock. Built as two additive pushes with a
  // pause between them — the pause is "or at least", and it is the point.
  const front =
    interpolate(frame, [beats.owned - 2, beats.owned + 28], [0, OWNED_ARC], {
      easing: Easing.inOut(Easing.cubic),
      ...clamp,
    }) +
    interpolate(frame, [beats.least + 2, beats.fromTwo + 3], [0, SERVED_ARC], {
      easing: Easing.inOut(Easing.cubic),
      ...clamp,
    });

  const arcOn = interpolate(frame, [beats.owned - 4, beats.owned + 8], [0, 1], clamp);
  const dropIn = interpolate(frame, [beats.most + 1, beats.most + 13], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const labelIn = interpolate(frame, [beats.compute - 2, beats.compute + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const logoIn = interpolate(frame, [beats.twoLabs, beats.twoLabs + 14], [0, 1], {
    easing: EXPO,
    ...clamp,
  });

  const solidEnd = Math.min(front, OWNED_ARC);
  const dashedEnd = front;

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="owned-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${parseInt(accent.slice(1, 3), 16) / 255} 0 0 0 0 ${
                parseInt(accent.slice(3, 5), 16) / 255
              } 0 0 0 0 ${parseInt(accent.slice(5, 7), 16) / 255} 0 0 0 1 0`}
            />
          </filter>
          <linearGradient id="axis-fade" x1={NOW_X} x2={AXIS_X1} y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={ink} stopOpacity="1" />
            <stop offset={FADE_FROM} stopColor={ink} stopOpacity="1" />
            <stop offset="1" stopColor={ink} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* Time, running out of frame. */}
          <g opacity={axisDim}>
            <line
              x1={NOW_X}
              y1={AXIS_LINE_Y}
              x2={axisX1}
              y2={AXIS_LINE_Y}
              stroke="url(#axis-fade)"
              strokeWidth={AXIS_W}
              strokeLinecap="round"
              opacity={dimOpacity}
            />

            {Array.from({length: 9}, (_, k) => {
              const y = (k + 1) / 2;
              const x = yearX(y);
              if (x > AXIS_X1) return null;
              const whole = Number.isInteger(y);
              const on = tickOn(x) * fadeAt(x);
              if (on <= 0.002) return null;
              return (
                <line
                  key={`t${k}`}
                  x1={snap(x)}
                  y1={AXIS_LINE_Y}
                  x2={snap(x)}
                  y2={AXIS_LINE_Y - (whole ? YEAR_TICK : HALF_TICK)}
                  stroke={ink}
                  strokeWidth={AXIS_W}
                  strokeLinecap="round"
                  opacity={(whole ? 0.55 : 0.3) * on}
                />
              );
            })}

            {/* Now. The one mark on the axis that is not a measurement. */}
            <line
              x1={snap(NOW_X)}
              y1={AXIS_LINE_Y + 6}
              x2={snap(NOW_X)}
              y2={AXIS_LINE_Y - NOW_TICK}
              stroke={ink}
              strokeWidth={AXIS_W + 2}
              strokeLinecap="round"
              opacity={0.62 * clamp01((axisX1 - NOW_X) / 30)}
            />

            {/* The span he is describing, laid over the axis it measures. */}
            <g opacity={spanOn}>
              <line
                x1={NOW_X}
                y1={AXIS_LINE_Y}
                x2={headX}
                y2={AXIS_LINE_Y}
                stroke={ink}
                strokeWidth={SPAN_W}
                strokeLinecap="round"
                opacity={0.9}
              />
              <line
                x1={snap(headX)}
                y1={AXIS_LINE_Y + 4}
                x2={snap(headX)}
                y2={AXIS_LINE_Y - HEAD_TICK}
                stroke={ink}
                strokeWidth={SPAN_W}
                strokeLinecap="round"
                opacity={0.9}
              />
            </g>
          </g>

          {/* From that moment, down into what it means. */}
          <line
            x1={snap(CX)}
            y1={DROP_Y0}
            x2={snap(CX)}
            y2={DROP_Y0 + (DROP_Y1 - DROP_Y0) * dropIn}
            stroke={ink}
            strokeWidth={AXIS_W}
            strokeLinecap="round"
            opacity={0.32 * dropIn}
          />

          {/* The world's compute, counted in eighths. */}
          {Array.from({length: segments.total}, (_, i) => {
            const enter = segIn(i);
            if (enter <= 0.002) return null;
            const a0 = -90 + i * STEP + SEG_GAP / 2;
            const a1 = -90 + (i + 1) * STEP - SEG_GAP / 2;
            // Grows in thickness from its own mid-line, so nothing slides and
            // the wheel is dimensionally right the moment it is legible.
            const owned = i < segments.owned;
            const served = !owned && i < segments.owned + segments.served;
            // Taken straight off the front, not off a timer, so a segment can
            // never change before the boundary reaches it.
            const t = owned || served ? clamp01((front - i * STEP) / CONVERT_ARC) : 0;
            const target = owned ? ownedOpacity : servedOpacity;
            // Only ownership changes the material. The outline is what the
            // served segments get instead.
            const fill = owned ? interpolateColors(t, [0, 1], [ink, accent]) : ink;
            const pull = served ? SERVED_PULL * t : 0;
            const rIn = R_MID - (R_MID - R_IN) * enter + pull;
            const rOut = R_MID + (R_OUT - R_MID) * enter + pull;

            return (
              <path
                key={`s${i}`}
                d={annulus(a0, a1, rIn, rOut)}
                fill={fill}
                fillOpacity={(readOpacity + (target - readOpacity) * t) * enter}
                stroke={accent}
                strokeWidth={SEG_STROKE}
                strokeOpacity={served ? t * enter : 0}
              />
            );
          })}

          {/* The boundary of what the two labs command. Solid where they own
              the compute, dashed where they only have first call on it — and
              it does not stop at the edge of what they own. */}
          <g opacity={arcOn}>
            {solidEnd > 0.4 ? (
              <path
                d={arcPath(ARC_R, -90, -90 + solidEnd)}
                fill="none"
                stroke={accent}
                strokeWidth={ARC_W}
                strokeLinecap="round"
                opacity={0.95}
              />
            ) : null}
            {dashedEnd - OWNED_ARC > 0.4 ? (
              <path
                d={arcPath(ARC_R, -90 + OWNED_ARC, -90 + dashedEnd)}
                fill="none"
                stroke={accent}
                strokeWidth={ARC_W}
                strokeLinecap="round"
                strokeDasharray="15 13"
                opacity={0.95}
              />
            ) : null}
            {[0, front].map((a, k) => {
              const [x0, y0] = pt(ARC_R - ARC_CAP / 2, -90 + a);
              const [x1, y1] = pt(ARC_R + ARC_CAP / 2, -90 + a);
              return (
                <line
                  key={`c${k}`}
                  x1={x0}
                  y1={y0}
                  x2={x1}
                  y2={y1}
                  stroke={accent}
                  strokeWidth={ARC_W}
                  strokeLinecap="round"
                  opacity={0.95}
                />
              );
            })}
          </g>
        </g>
      </svg>

      {/* Whose. */}
      {(
        [
          {src: logos.left, size: logoSize.left, side: -1 as const},
          {src: logos.right, size: logoSize.right, side: 1 as const},
        ]
      ).map((l, i) => {
        const half = (logoSize.left + logoGap + logoSize.right) / 2;
        const left = l.side < 0 ? CX - half : CX + half - l.size;
        return (
          <Img
            key={`l${i}`}
            src={staticFile(l.src)}
            style={{
              position: 'absolute',
              left,
              top: CY - l.size / 2,
              width: l.size,
              height: l.size,
              opacity: logoIn,
              transform: `scale(${0.76 + 0.24 * logoIn})`,
              filter: `url(#owned-tint) drop-shadow(0 2px 6px ${shadow})`,
            }}
          />
        );
      })}

      <div
        style={{
          ...typeStyle(MARK_SIZE, ink),
          top: MARK_TOP,
          left: NOW_X,
          transform: 'translateX(-50%)',
          opacity: (markOpacity + 0.3) * clamp01((axisX1 - NOW_X) / 30) * axisDim,
        }}
      >
        {nowLabel}
      </div>

      {[1, 2, 3].map((y) => {
        const x = yearX(y);
        const on = tickOn(x + 22) * fadeAt(x);
        if (on <= 0.002) return null;
        return (
          <div
            key={`n${y}`}
            style={{
              ...typeStyle(MARK_SIZE, ink),
              top: MARK_TOP,
              left: x,
              transform: 'translateX(-50%)',
              opacity:
                (markOpacity + (0.94 - markOpacity) * nearHead(x)) * on * axisDim,
            }}
          >
            {y}
          </div>
        );
      })}

      <div
        style={{
          ...typeStyle(UNIT_SIZE, ink),
          top: MARK_TOP + MARK_SIZE - UNIT_SIZE,
          left: yearX(3) + 50,
          opacity: 0.34 * clamp01((axisX1 - yearX(3) - 120) / 50) * axisDim,
        }}
      >
        {unitLabel}
      </div>

      <div
        style={{
          ...typeStyle(LABEL_SIZE, ink),
          top: LABEL_TOP,
          left: 0,
          width: 1080,
          textAlign: 'center',
          opacity: 0.72 * labelIn,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

export default TwoLabsOwnedOrServed;
